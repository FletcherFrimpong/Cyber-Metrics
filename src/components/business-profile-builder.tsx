"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Building, 
  Globe, 
  Shield, 
  Users, 
  Database, 
  Network, 
  FileText,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Target,
  BarChart3
} from "lucide-react"

interface BusinessProfile {
  companyName: string
  industry: string
  country: string
  employeeCount: string
  annualRevenue: string
  businessUnits: BusinessUnit[]
  assets: Asset[]
  regulatoryRequirements: string[]
  technicalInfrastructure: TechnicalInfrastructure
  riskProfile: RiskProfile
}

interface BusinessUnit {
  id: string
  name: string
  description: string
  criticality: 'low' | 'medium' | 'high' | 'critical'
  assets: string[]
  annualRevenue: number
  employeeCount: number
}

interface Asset {
  id: string
  name: string
  type: 'data' | 'system' | 'network' | 'physical' | 'application'
  businessUnit: string
  criticality: 'low' | 'medium' | 'high' | 'critical'
  value: number
  description: string
}

interface TechnicalInfrastructure {
  cloudServices: string[]
  onPremiseSystems: string[]
  networkSegments: string[]
  dataCenters: number
  remoteWorkers: number
  thirdPartyVendors: number
}

interface RiskProfile {
  cyberRiskTolerance: 'low' | 'medium' | 'high'
  complianceRequirements: string[]
  industrySpecificRisks: string[]
  previousIncidents: number
  insuranceCoverage: number
}

const INDUSTRIES = [
  { id: 'bfsi', name: 'Banking, Financial Services & Insurance', riskLevel: 'high' },
  { id: 'healthcare', name: 'Healthcare', riskLevel: 'high' },
  { id: 'retail', name: 'Retail & E-commerce', riskLevel: 'medium' },
  { id: 'manufacturing', name: 'Manufacturing', riskLevel: 'medium' },
  { id: 'technology', name: 'Technology & Software', riskLevel: 'medium' },
  { id: 'energy', name: 'Energy & Utilities', riskLevel: 'high' },
  { id: 'government', name: 'Government & Defense', riskLevel: 'critical' },
  { id: 'education', name: 'Education', riskLevel: 'medium' }
]

const REGULATORY_FRAMEWORKS = [
  { id: 'gdpr', name: 'GDPR (EU Data Protection)', applicable: ['healthcare', 'retail', 'technology'] },
  { id: 'sox', name: 'SOX (Sarbanes-Oxley)', applicable: ['bfsi', 'retail', 'manufacturing'] },
  { id: 'pci-dss', name: 'PCI-DSS (Payment Card Industry)', applicable: ['bfsi', 'retail'] },
  { id: 'hipaa', name: 'HIPAA (Healthcare)', applicable: ['healthcare'] },
  { id: 'fedramp', name: 'FedRAMP (Federal)', applicable: ['government'] },
  { id: 'iso27001', name: 'ISO 27001', applicable: ['all'] },
  { id: 'nist', name: 'NIST Cybersecurity Framework', applicable: ['all'] }
]

export default function BusinessProfileBuilder() {
  const [currentStep, setCurrentStep] = useState(1)
  const [profile, setProfile] = useState<BusinessProfile>({
    companyName: '',
    industry: '',
    country: '',
    employeeCount: '',
    annualRevenue: '',
    businessUnits: [],
    assets: [],
    regulatoryRequirements: [],
    technicalInfrastructure: {
      cloudServices: [],
      onPremiseSystems: [],
      networkSegments: [],
      dataCenters: 0,
      remoteWorkers: 0,
      thirdPartyVendors: 0
    },
    riskProfile: {
      cyberRiskTolerance: 'medium',
      complianceRequirements: [],
      industrySpecificRisks: [],
      previousIncidents: 0,
      insuranceCoverage: 0
    }
  })

  const [newBusinessUnit, setNewBusinessUnit] = useState<Partial<BusinessUnit>>({
    name: '',
    description: '',
    criticality: 'medium',
    annualRevenue: 0,
    employeeCount: 0
  })

  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    name: '',
    type: 'data',
    businessUnit: '',
    criticality: 'medium',
    value: 0,
    description: ''
  })

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const addBusinessUnit = () => {
    if (newBusinessUnit.name && newBusinessUnit.description) {
      const unit: BusinessUnit = {
        id: `bu-${Date.now()}`,
        name: newBusinessUnit.name,
        description: newBusinessUnit.description,
        criticality: newBusinessUnit.criticality || 'medium',
        assets: [],
        annualRevenue: newBusinessUnit.annualRevenue || 0,
        employeeCount: newBusinessUnit.employeeCount || 0
      }
      setProfile(prev => ({
        ...prev,
        businessUnits: [...prev.businessUnits, unit]
      }))
      setNewBusinessUnit({
        name: '',
        description: '',
        criticality: 'medium',
        annualRevenue: 0,
        employeeCount: 0
      })
    }
  }

  const addAsset = () => {
    if (newAsset.name && newAsset.businessUnit) {
      const asset: Asset = {
        id: `asset-${Date.now()}`,
        name: newAsset.name,
        type: newAsset.type || 'data',
        businessUnit: newAsset.businessUnit,
        criticality: newAsset.criticality || 'medium',
        value: newAsset.value || 0,
        description: newAsset.description || ''
      }
      setProfile(prev => ({
        ...prev,
        assets: [...prev.assets, asset]
      }))
      setNewAsset({
        name: '',
        type: 'data',
        businessUnit: '',
        criticality: 'medium',
        value: 0,
        description: ''
      })
    }
  }

  const getApplicableRegulations = () => {
    if (!profile.industry) return []
    return REGULATORY_FRAMEWORKS.filter(reg => 
      reg.applicable.includes(profile.industry) || reg.applicable.includes('all')
    )
  }

  const calculateRiskScore = () => {
    let score = 0
    const industry = INDUSTRIES.find(i => i.id === profile.industry)
    if (industry?.riskLevel === 'high') score += 25
    if (industry?.riskLevel === 'critical') score += 35
    
    score += profile.businessUnits.filter(bu => bu.criticality === 'critical').length * 10
    score += profile.assets.filter(asset => asset.criticality === 'critical').length * 5
    score += profile.regulatoryRequirements.length * 3
    
    return Math.min(score, 100)
  }

  const renderStep1 = () => (
    <div className="space-y-4 lg:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Basic Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-300">Company Name</label>
              <input
                type="text"
                value={profile.companyName}
                onChange={(e) => setProfile(prev => ({ ...prev, companyName: e.target.value }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-300">Industry</label>
              <select
                value={profile.industry}
                onChange={(e) => setProfile(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map(industry => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name} ({industry.riskLevel} risk)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-300">Country</label>
              <input
                type="text"
                value={profile.country}
                onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
                placeholder="Enter country"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-300">Employee Count</label>
                <select
                  value={profile.employeeCount}
                  onChange={(e) => setProfile(prev => ({ ...prev, employeeCount: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
                >
                  <option value="">Select range</option>
                  <option value="1-50">1-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-1000">201-1,000</option>
                  <option value="1001-5000">1,001-5,000</option>
                  <option value="5001+">5,001+</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-300">Annual Revenue</label>
                <select
                  value={profile.annualRevenue}
                  onChange={(e) => setProfile(prev => ({ ...prev, annualRevenue: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
                >
                  <option value="">Select range</option>
                  <option value="<1M">&lt;$1M</option>
                  <option value="1M-10M">$1M-$10M</option>
                  <option value="10M-100M">$10M-$100M</option>
                  <option value="100M-1B">$100M-$1B</option>
                  <option value="1B+">$1B+</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Risk Profile Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {calculateRiskScore()}/100
              </div>
              <div className="text-sm text-neutral-400">Overall Risk Score</div>
            </div>
            
            {profile.industry && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">Industry Risk</span>
                  <Badge variant={INDUSTRIES.find(i => i.id === profile.industry)?.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                    {INDUSTRIES.find(i => i.id === profile.industry)?.riskLevel}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">Applicable Regulations</span>
                  <Badge variant="outline">
                    {getApplicableRegulations().length}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Business Units & Organizational Structure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-300">Business Unit Name</label>
              <input
                type="text"
                value={newBusinessUnit.name}
                onChange={(e) => setNewBusinessUnit(prev => ({ ...prev, name: e.target.value }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
                placeholder="e.g., IT Department"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-300">Criticality Level</label>
              <select
                value={newBusinessUnit.criticality}
                onChange={(e) => setNewBusinessUnit(prev => ({ ...prev, criticality: e.target.value as any }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-300">Description</label>
            <textarea
              value={newBusinessUnit.description}
              onChange={(e) => setNewBusinessUnit(prev => ({ ...prev, description: e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
              rows={3}
              placeholder="Describe the business unit's function and importance"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-300">Annual Revenue ($M)</label>
              <input
                type="number"
                value={newBusinessUnit.annualRevenue}
                onChange={(e) => setNewBusinessUnit(prev => ({ ...prev, annualRevenue: parseFloat(e.target.value) || 0 }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-300">Employee Count</label>
              <input
                type="number"
                value={newBusinessUnit.employeeCount}
                onChange={(e) => setNewBusinessUnit(prev => ({ ...prev, employeeCount: parseInt(e.target.value) || 0 }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
                placeholder="0"
              />
            </div>
          </div>
          <Button onClick={addBusinessUnit} className="w-full">
            Add Business Unit
          </Button>
        </CardContent>
      </Card>

      {profile.businessUnits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Business Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {profile.businessUnits.map(unit => (
                <div key={unit.id} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{unit.name}</h4>
                    <Badge variant={
                      unit.criticality === 'critical' ? 'destructive' :
                      unit.criticality === 'high' ? 'default' :
                      unit.criticality === 'medium' ? 'secondary' : 'outline'
                    }>
                      {unit.criticality}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-400 mb-2">{unit.description}</p>
                  <div className="text-xs text-neutral-500">
                    Revenue: ${unit.annualRevenue}M | Employees: {unit.employeeCount}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Asset Inventory Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-300">Asset Name</label>
              <input
                type="text"
                value={newAsset.name}
                onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
                placeholder="e.g., Customer Database"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-300">Asset Type</label>
              <select
                value={newAsset.type}
                onChange={(e) => setNewAsset(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
              >
                <option value="data">Data</option>
                <option value="system">System</option>
                <option value="network">Network</option>
                <option value="physical">Physical</option>
                <option value="application">Application</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-300">Business Unit</label>
              <select
                value={newAsset.businessUnit}
                onChange={(e) => setNewAsset(prev => ({ ...prev, businessUnit: e.target.value }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
              >
                <option value="">Select business unit</option>
                {profile.businessUnits.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-300">Criticality</label>
              <select
                value={newAsset.criticality}
                onChange={(e) => setNewAsset(prev => ({ ...prev, criticality: e.target.value as any }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-300">Asset Value ($M)</label>
              <input
                type="number"
                value={newAsset.value}
                onChange={(e) => setNewAsset(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-300">Description</label>
              <input
                type="text"
                value={newAsset.description}
                onChange={(e) => setNewAsset(prev => ({ ...prev, description: e.target.value }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
                placeholder="Brief description"
              />
            </div>
          </div>
          <Button onClick={addAsset} className="w-full">
            Add Asset
          </Button>
        </CardContent>
      </Card>

      {profile.assets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Asset Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.assets.map(asset => (
                <div key={asset.id} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{asset.name}</h4>
                    <Badge variant={
                      asset.criticality === 'critical' ? 'destructive' :
                      asset.criticality === 'high' ? 'default' :
                      asset.criticality === 'medium' ? 'secondary' : 'outline'
                    }>
                      {asset.criticality}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-400 mb-2">{asset.description}</p>
                  <div className="text-xs text-neutral-500 space-y-1">
                    <div>Type: {asset.type}</div>
                    <div>Value: ${asset.value}M</div>
                    <div>Unit: {profile.businessUnits.find(bu => bu.id === asset.businessUnit)?.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Technical Infrastructure Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-white mb-3">Cloud Services</h4>
              <div className="space-y-2">
                {['AWS', 'Azure', 'Google Cloud', 'Oracle Cloud', 'IBM Cloud'].map(service => (
                  <label key={service} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={profile.technicalInfrastructure.cloudServices.includes(service)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProfile(prev => ({
                            ...prev,
                            technicalInfrastructure: {
                              ...prev.technicalInfrastructure,
                              cloudServices: [...prev.technicalInfrastructure.cloudServices, service]
                            }
                          }))
                        } else {
                          setProfile(prev => ({
                            ...prev,
                            technicalInfrastructure: {
                              ...prev.technicalInfrastructure,
                              cloudServices: prev.technicalInfrastructure.cloudServices.filter(s => s !== service)
                            }
                          }))
                        }
                      }}
                      className="rounded border-neutral-600 bg-neutral-800"
                    />
                    <span className="text-sm text-neutral-300">{service}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">On-Premise Systems</h4>
              <div className="space-y-2">
                {['Windows Servers', 'Linux Servers', 'Mainframes', 'Network Equipment', 'Storage Systems'].map(system => (
                  <label key={system} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={profile.technicalInfrastructure.onPremiseSystems.includes(system)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProfile(prev => ({
                            ...prev,
                            technicalInfrastructure: {
                              ...prev.technicalInfrastructure,
                              onPremiseSystems: [...prev.technicalInfrastructure.onPremiseSystems, system]
                            }
                          }))
                        } else {
                          setProfile(prev => ({
                            ...prev,
                            technicalInfrastructure: {
                              ...prev.technicalInfrastructure,
                              onPremiseSystems: prev.technicalInfrastructure.onPremiseSystems.filter(s => s !== system)
                            }
                          }))
                        }
                      }}
                      className="rounded border-neutral-600 bg-neutral-800"
                    />
                    <span className="text-sm text-neutral-300">{system}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-300">Data Centers</label>
              <input
                type="number"
                value={profile.technicalInfrastructure.dataCenters}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  technicalInfrastructure: {
                    ...prev.technicalInfrastructure,
                    dataCenters: parseInt(e.target.value) || 0
                  }
                }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-300">Remote Workers</label>
              <input
                type="number"
                value={profile.technicalInfrastructure.remoteWorkers}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  technicalInfrastructure: {
                    ...prev.technicalInfrastructure,
                    remoteWorkers: parseInt(e.target.value) || 0
                  }
                }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-300">Third-Party Vendors</label>
              <input
                type="number"
                value={profile.technicalInfrastructure.thirdPartyVendors}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  technicalInfrastructure: {
                    ...prev.technicalInfrastructure,
                    thirdPartyVendors: parseInt(e.target.value) || 0
                  }
                }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Regulatory Compliance & Risk Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium text-white mb-3">Applicable Regulations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getApplicableRegulations().map(regulation => (
                <label key={regulation.id} className="flex items-center space-x-2 p-3 bg-neutral-800 rounded-lg border border-neutral-700">
                  <input
                    type="checkbox"
                    checked={profile.regulatoryRequirements.includes(regulation.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setProfile(prev => ({
                          ...prev,
                          regulatoryRequirements: [...prev.regulatoryRequirements, regulation.id]
                        }))
                      } else {
                        setProfile(prev => ({
                          ...prev,
                          regulatoryRequirements: prev.regulatoryRequirements.filter(r => r !== regulation.id)
                        }))
                      }
                    }}
                    className="rounded border-neutral-600 bg-neutral-800"
                  />
                  <span className="text-sm text-neutral-300">{regulation.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-neutral-300">Cyber Risk Tolerance</label>
            <select
              value={profile.riskProfile.cyberRiskTolerance}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                riskProfile: {
                  ...prev.riskProfile,
                  cyberRiskTolerance: e.target.value as any
                }
              }))}
              className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
            >
              <option value="low">Low - Conservative approach</option>
              <option value="medium">Medium - Balanced approach</option>
              <option value="high">High - Aggressive approach</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-300">Previous Security Incidents (Last 2 years)</label>
              <input
                type="number"
                value={profile.riskProfile.previousIncidents}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  riskProfile: {
                    ...prev.riskProfile,
                    previousIncidents: parseInt(e.target.value) || 0
                  }
                }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-300">Cyber Insurance Coverage ($M)</label>
              <input
                type="number"
                value={profile.riskProfile.insuranceCoverage}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  riskProfile: {
                    ...prev.riskProfile,
                    insuranceCoverage: parseFloat(e.target.value) || 0
                  }
                }))}
                className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white"
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Business Departments Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500 mb-1">
                {profile.businessUnits.length}
              </div>
              <div className="text-sm text-neutral-400">Business Units</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500 mb-1">
                {profile.assets.length}
              </div>
              <div className="text-sm text-neutral-400">Assets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500 mb-1">
                {profile.regulatoryRequirements.length}
              </div>
              <div className="text-sm text-neutral-400">Regulations</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-neutral-800 rounded-lg">
            <h4 className="font-medium text-white mb-2">Risk Assessment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-300">Overall Risk Score:</span>
                <span className="text-orange-500 font-medium">{calculateRiskScore()}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-300">Critical Assets:</span>
                <span className="text-red-500 font-medium">
                  {profile.assets.filter(a => a.criticality === 'critical').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-300">Critical Business Units:</span>
                <span className="text-red-500 font-medium">
                  {profile.businessUnits.filter(bu => bu.criticality === 'critical').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-300">Compliance Requirements:</span>
                <span className="text-yellow-500 font-medium">
                  {profile.regulatoryRequirements.length}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      case 5: return renderStep5()
      default: return renderStep1()
    }
  }

  return (
    <div className="min-h-screen p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Business Departments</h2>
        <Badge variant="outline">Step {currentStep} of {totalSteps}</Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-neutral-400">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex-1 overflow-auto">
        {renderCurrentStep()}
      </div>

      <div className="flex justify-between pt-4 border-t border-neutral-700">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        {currentStep < totalSteps ? (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={
              (currentStep === 1 && (!profile.companyName || !profile.industry)) ||
              (currentStep === 2 && profile.businessUnits.length === 0) ||
              (currentStep === 3 && profile.assets.length === 0)
            }
          >
            Next
          </Button>
        ) : (
          <Button className="bg-green-600 hover:bg-green-700">
            Complete Profile
          </Button>
        )}
      </div>
    </div>
  )
} 