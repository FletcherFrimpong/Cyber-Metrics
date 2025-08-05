"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Target, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Zap,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  Building,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Eye,
  Download,
  Settings
} from "lucide-react"

interface SecurityInvestment {
  id: string
  name: string
  category: 'edr' | 'siem' | 'firewall' | 'training' | 'compliance' | 'incident-response'
  priority: 'low' | 'medium' | 'high' | 'critical'
  currentInvestment: number // annual cost
  proposedInvestment: number // new annual cost
  expectedCostSavings: number // annual savings from incidents prevented
  expectedROI: number // return on investment percentage
  riskReduction: number // percentage reduction in security incidents
  timeToImplement: number // in months
  description: string
  currentGaps: string[]
  expectedBenefits: string[]
  implementationSteps: string[]
  successMetrics: string[]
}

interface InvestmentComparison {
  investmentId: string
  scenario: 'current' | 'proposed' | 'optimized'
  annualCost: number
  incidentsPrevented: number
  costSavings: number
  roi: number
  paybackPeriod: number // in months
}

interface SecurityBudget {
  totalBudget: number
  allocated: number
  unallocated: number
  recommendations: SecurityInvestment[]
  priorityInvestments: string[]
}

export default function StrategicDecisionSupport() {
  const [investments, setInvestments] = useState<SecurityInvestment[]>([])
  const [comparisons, setComparisons] = useState<InvestmentComparison[]>([])
  const [budget, setBudget] = useState<SecurityBudget | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      loadROIData()
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const loadROIData = () => {
    // Mock ROI-focused security investment data
    const mockInvestments: SecurityInvestment[] = [
      {
        id: 'edr-upgrade',
        name: 'EDR Platform Upgrade',
        category: 'edr',
        priority: 'critical',
        currentInvestment: 480000, // Current annual cost
        proposedInvestment: 720000, // Upgraded annual cost
        expectedCostSavings: 2400000, // Additional savings from better detection
        expectedROI: 400, // 400% ROI on additional investment
        riskReduction: 35, // 35% reduction in security incidents
        timeToImplement: 3,
        description: 'Upgrade to advanced EDR with AI-powered threat detection and automated response capabilities',
        currentGaps: [
          'Limited automated response capabilities',
          'No AI-powered threat detection',
          'Manual incident triage required',
          'Limited threat hunting tools'
        ],
        expectedBenefits: [
          'Automated threat containment',
          'AI-powered anomaly detection',
          'Reduced incident response time',
          'Proactive threat hunting'
        ],
        implementationSteps: [
          'Vendor evaluation and selection',
          'Proof of concept testing',
          'Pilot deployment',
          'Full rollout and training'
        ],
        successMetrics: [
          'Incident response time < 15 minutes',
          'False positive rate < 1%',
          'Automated containment rate > 90%',
          'Threat hunting efficiency +50%'
        ]
      },
      {
        id: 'siem-enhancement',
        name: 'SIEM Enhancement & Integration',
        category: 'siem',
        priority: 'high',
        currentInvestment: 320000,
        proposedInvestment: 480000,
        expectedCostSavings: 1800000,
        expectedROI: 375,
        riskReduction: 25,
        timeToImplement: 4,
        description: 'Enhance SIEM with advanced analytics, threat intelligence feeds, and automated correlation',
        currentGaps: [
          'Limited threat intelligence integration',
          'Manual alert correlation',
          'No automated response workflows',
          'Limited reporting capabilities'
        ],
        expectedBenefits: [
          'Automated threat correlation',
          'Real-time threat intelligence',
          'Advanced analytics and reporting',
          'Reduced alert fatigue'
        ],
        implementationSteps: [
          'Threat intelligence feed integration',
          'Advanced correlation rules development',
          'Automated response workflow setup',
          'Analytics dashboard creation'
        ],
        successMetrics: [
          'Alert correlation accuracy > 95%',
          'False positive reduction > 60%',
          'Incident detection time < 5 minutes',
          'Threat intelligence coverage > 90%'
        ]
      },
      {
        id: 'security-training',
        name: 'Advanced Security Training Program',
        category: 'training',
        priority: 'high',
        currentInvestment: 120000,
        proposedInvestment: 240000,
        expectedCostSavings: 900000,
        expectedROI: 375,
        riskReduction: 40,
        timeToImplement: 2,
        description: 'Comprehensive security awareness and technical training program for all employees',
        currentGaps: [
          'Basic security awareness only',
          'No technical security training',
          'Limited phishing simulation',
          'No security culture metrics'
        ],
        expectedBenefits: [
          'Reduced phishing susceptibility',
          'Improved security culture',
          'Faster incident reporting',
          'Better compliance posture'
        ],
        implementationSteps: [
          'Training needs assessment',
          'Content development and customization',
          'Pilot program launch',
          'Full rollout with metrics tracking'
        ],
        successMetrics: [
          'Phishing click rate < 5%',
          'Security incident reporting +200%',
          'Training completion rate > 95%',
          'Security culture score > 8/10'
        ]
      },
      {
        id: 'incident-response',
        name: 'Incident Response Team Enhancement',
        category: 'incident-response',
        priority: 'medium',
        currentInvestment: 360000,
        proposedInvestment: 540000,
        expectedCostSavings: 1200000,
        expectedROI: 222,
        riskReduction: 30,
        timeToImplement: 6,
        description: 'Expand incident response team with specialized roles and 24/7 coverage',
        currentGaps: [
          'Limited 24/7 coverage',
          'No specialized threat hunters',
          'Manual incident documentation',
          'Limited forensic capabilities'
        ],
        expectedBenefits: [
          '24/7 incident response coverage',
          'Specialized threat hunting',
          'Automated incident documentation',
          'Enhanced forensic capabilities'
        ],
        implementationSteps: [
          'Team structure redesign',
          'Specialist recruitment',
          'Process automation implementation',
          '24/7 shift scheduling'
        ],
        successMetrics: [
          'Incident response time < 30 minutes',
          'Threat containment time < 2 hours',
          'Documentation accuracy > 95%',
          'Team satisfaction score > 8/10'
        ]
      }
    ]

    const mockComparisons: InvestmentComparison[] = [
      {
        investmentId: 'edr-upgrade',
        scenario: 'current',
        annualCost: 480000,
        incidentsPrevented: 36,
        costSavings: 5400000,
        roi: 1025,
        paybackPeriod: 1
      },
      {
        investmentId: 'edr-upgrade',
        scenario: 'proposed',
        annualCost: 720000,
        incidentsPrevented: 49,
        costSavings: 7800000,
        roi: 983,
        paybackPeriod: 1
      },
      {
        investmentId: 'siem-enhancement',
        scenario: 'current',
        annualCost: 320000,
        incidentsPrevented: 25,
        costSavings: 3750000,
        roi: 1072,
        paybackPeriod: 1
      },
      {
        investmentId: 'siem-enhancement',
        scenario: 'proposed',
        annualCost: 480000,
        incidentsPrevented: 31,
        costSavings: 5550000,
        roi: 1056,
        paybackPeriod: 1
      }
    ]

    const mockBudget: SecurityBudget = {
      totalBudget: 2000000,
      allocated: 1280000,
      unallocated: 720000,
      recommendations: mockInvestments,
      priorityInvestments: ['edr-upgrade', 'security-training']
    }

    setInvestments(mockInvestments)
    setComparisons(mockComparisons)
    setBudget(mockBudget)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'edr': return <Shield className="w-4 h-4" />
      case 'siem': return <BarChart3 className="w-4 h-4" />
      case 'firewall': return <Target className="w-4 h-4" />
      case 'training': return <Users className="w-4 h-4" />
      case 'compliance': return <FileText className="w-4 h-4" />
      case 'incident-response': return <AlertTriangle className="w-4 h-4" />
      default: return <Zap className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/10 border-red-500/30 text-red-400'
      case 'high': return 'bg-orange-500/10 border-orange-500/30 text-orange-400'
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
      case 'low': return 'bg-green-500/10 border-green-500/30 text-green-400'
      default: return 'bg-neutral-500/10 border-neutral-500/30 text-neutral-400'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'edr': return 'text-blue-400'
      case 'siem': return 'text-purple-400'
      case 'firewall': return 'text-green-400'
      case 'training': return 'text-orange-400'
      case 'compliance': return 'text-yellow-400'
      case 'incident-response': return 'text-red-400'
      default: return 'text-neutral-400'
    }
  }

  const filteredInvestments = investments.filter(investment => {
    const categoryMatch = selectedCategory === 'all' || investment.category === selectedCategory
    const priorityMatch = selectedPriority === 'all' || investment.priority === selectedPriority
    return categoryMatch && priorityMatch
  })

  const totalCurrentInvestment = investments.reduce((sum, inv) => sum + inv.currentInvestment, 0)
  const totalProposedInvestment = investments.reduce((sum, inv) => sum + inv.proposedInvestment, 0)
  const totalExpectedSavings = investments.reduce((sum, inv) => sum + inv.expectedCostSavings, 0)
  const averageROI = investments.length > 0 ? Math.round(investments.reduce((sum, inv) => sum + inv.expectedROI, 0) / investments.length) : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Loading ROI analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-h-screen overflow-y-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Security Investment ROI Analysis</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export ROI Report
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure Analysis
          </Button>
        </div>
      </div>

      {/* ROI Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CURRENT INVESTMENT</p>
                <p className="text-2xl font-bold text-white font-mono">${(totalCurrentInvestment / 1000).toFixed(0)}K</p>
                <p className="text-xs text-neutral-500">annual security spend</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">PROPOSED INVESTMENT</p>
                <p className="text-2xl font-bold text-white font-mono">${(totalProposedInvestment / 1000).toFixed(0)}K</p>
                <p className="text-xs text-neutral-500">enhanced security budget</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">EXPECTED SAVINGS</p>
                <p className="text-2xl font-bold text-white font-mono">${(totalExpectedSavings / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-neutral-500">annual cost avoidance</p>
              </div>
              <Shield className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">AVERAGE ROI</p>
                <p className="text-2xl font-bold text-white font-mono">{averageROI}%</p>
                <p className="text-xs text-neutral-500">return on investment</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Allocation */}
      {budget && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Security Budget Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-400">Total Budget</span>
                    <span className="text-white font-mono">${(budget.totalBudget / 1000).toFixed(0)}K</span>
                  </div>
                  <Progress value={100} className="h-2 bg-green-500/20" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-400">Allocated</span>
                    <span className="text-blue-400 font-mono">${(budget.allocated / 1000).toFixed(0)}K</span>
                  </div>
                  <Progress value={(budget.allocated / budget.totalBudget) * 100} className="h-2 bg-blue-500/20" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-400">Available</span>
                    <span className="text-orange-400 font-mono">${(budget.unallocated / 1000).toFixed(0)}K</span>
                  </div>
                  <Progress value={(budget.unallocated / budget.totalBudget) * 100} className="h-2 bg-orange-500/20" />
                </div>
              </div>
              
              <div className="lg:col-span-2">
                <h4 className="text-sm font-medium text-neutral-300 mb-3">Priority Investment Recommendations</h4>
                <div className="space-y-2">
                  {budget.priorityInvestments.map(investmentId => {
                    const investment = investments.find(inv => inv.id === investmentId)
                    if (!investment) return null
                    
                    return (
                      <div key={investmentId} className="flex items-center justify-between p-3 bg-neutral-800 rounded border border-neutral-700">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(investment.category)}
                          <div>
                            <div className="text-sm font-medium text-white">{investment.name}</div>
                            <div className="text-xs text-neutral-400">ROI: {investment.expectedROI}%</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-500">+${(investment.expectedCostSavings / 1000).toFixed(0)}K</div>
                          <div className="text-xs text-neutral-400">annual savings</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-300">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 bg-neutral-800 border border-neutral-600 rounded-md text-white text-sm min-w-[150px]"
          >
            <option value="all">All Categories</option>
            <option value="edr">EDR</option>
            <option value="siem">SIEM</option>
            <option value="firewall">Firewall</option>
            <option value="training">Training</option>
            <option value="compliance">Compliance</option>
            <option value="incident-response">Incident Response</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-300">Priority:</span>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1 bg-neutral-800 border border-neutral-600 rounded-md text-white text-sm min-w-[120px]"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Investment Recommendations */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Security Investment Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredInvestments.map(investment => (
              <div key={investment.id} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${getCategoryColor(investment.category)} bg-neutral-700`}>
                      {getCategoryIcon(investment.category)}
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">{investment.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(investment.priority)}`}>
                          {investment.priority}
                        </Badge>
                        <span className="text-xs text-neutral-400">{investment.timeToImplement} months</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-500">{investment.expectedROI}%</div>
                    <div className="text-xs text-neutral-400">ROI</div>
                  </div>
                </div>
                
                <p className="text-xs text-neutral-400 mb-3">{investment.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-neutral-400">Current Investment</div>
                    <div className="font-bold text-white text-sm">${(investment.currentInvestment / 1000).toFixed(0)}K</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400">Proposed Investment</div>
                    <div className="font-bold text-blue-400 text-sm">${(investment.proposedInvestment / 1000).toFixed(0)}K</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400">Expected Savings</div>
                    <div className="font-bold text-green-500 text-sm">${(investment.expectedCostSavings / 1000).toFixed(0)}K</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400">Risk Reduction</div>
                    <div className="font-bold text-orange-400 text-sm">{investment.riskReduction}%</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-neutral-400">
                    Payback: {Math.round((investment.proposedInvestment - investment.currentInvestment) / (investment.expectedCostSavings / 12))} months
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

        {/* ROI Comparison Analysis */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">ROI Comparison Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
            {comparisons.filter(comp => comp.scenario === 'proposed').map(comparison => {
              const investment = investments.find(inv => inv.id === comparison.investmentId)
              if (!investment) return null
              
              const currentComp = comparisons.find(c => c.investmentId === comparison.investmentId && c.scenario === 'current')
              
              return (
                <div key={comparison.investmentId} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="flex items-center gap-3 mb-3">
                    {getCategoryIcon(investment.category)}
                    <h4 className="font-medium text-white text-sm">{investment.name}</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-neutral-400">Current ROI</div>
                      <div className="font-bold text-white text-sm">{currentComp?.roi}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400">Proposed ROI</div>
                      <div className="font-bold text-green-500 text-sm">{comparison.roi}%</div>
                    </div>
                    <div>
                                             <div className="text-xs text-neutral-400">Current Savings</div>
                       <div className="font-bold text-white text-sm">${((currentComp?.costSavings || 0) / 1000).toFixed(0)}K</div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400">Proposed Savings</div>
                      <div className="font-bold text-green-500 text-sm">${(comparison.costSavings / 1000).toFixed(0)}K</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">Additional Investment:</span>
                      <span className="text-blue-400">${((comparison.annualCost - (currentComp?.annualCost || 0)) / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">Additional Savings:</span>
                      <span className="text-green-500">${((comparison.costSavings - (currentComp?.costSavings || 0)) / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">Payback Period:</span>
                      <span className="text-orange-400">{comparison.paybackPeriod} month</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 