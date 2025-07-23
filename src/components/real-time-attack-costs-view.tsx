'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database,
  BarChart3,
  Activity,
  Zap,
  Eye,
  FileText,
  List,
  Search
} from 'lucide-react';

interface RealTimeAttackCost {
  ruleId: string;
  ruleName: string;
  totalCost: number;
  baseCost: number;
  industryCost: number;
  threatActorCost: number;
  techniqueCost: number;
  complianceCost: number;
  costBreakdown: {
    base: number;
    industry: number;
    threat: number;
    technique: number;
    compliance: number;
  };
  threatIntelligence: {
    threatActors: string[];
    mitreTechniques: string[];
    recentAttacks: RecentAttack[];
    confidenceScore: number;
    dataSource: string;
  };
  industryContext: {
    industry: string;
    industryMultiplier: number;
    averageIndustryCost: number;
    complianceRequirements: string[];
  };
}

interface RuleWithAttackCost {
  ruleId: string;
  ruleName: string;
  platform: string;
  severity: string;
  status: string;
  attackCost: number;
  costBreakdown: {
    base: number;
    industry: number;
    threat: number;
    technique: number;
    compliance: number;
  };
  threatActors: string[];
  mitreTechniques: string[];
  complianceRequirements: string[];
  lastUpdated: Date;
  confidenceScore: number;
}

interface RecentAttack {
  company: string;
  cost: number;
  date: string;
  threatActor: string;
  technique: string;
  industry: string;
  source: string;
}

interface AttackCostSummary {
  totalCost: number;
  averageCost: number;
  maxCost: number;
  minCost: number;
  costDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  totalRules: number;
  industry: string;
}

interface AllRulesSummary {
  totalRules: number;
  totalCost: number;
  averageCost: number;
  maxCost: number;
  minCost: number;
  industry: string;
}

const INDUSTRIES = [
  'Technology', 'Financial Services', 'Healthcare', 'Energy', 
  'Manufacturing', 'Retail', 'Education', 'Government', 
  'Hospitality', 'Professional Services'
];

export default function RealTimeAttackCostsView() {
  const [selectedIndustry, setSelectedIndustry] = useState('Technology');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [attackCosts, setAttackCosts] = useState<RealTimeAttackCost[]>([]);
  const [allRulesWithCosts, setAllRulesWithCosts] = useState<RuleWithAttackCost[]>([]);
  const [summary, setSummary] = useState<AttackCostSummary | null>(null);
  const [allRulesSummary, setAllRulesSummary] = useState<AllRulesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed' | 'allRules'>('summary');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch attack costs data
  const fetchAttackCosts = async (industry: string, ruleId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        industry,
        realData: 'true'
      });
      
      if (ruleId) {
        params.append('ruleId', ruleId);
      }
      
      const response = await fetch(`/api/analytics/attack-costs?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAttackCosts(data.data.attackCosts || []);
        setSummary(data.data.summary || null);
      } else {
        setError(data.error || 'Failed to fetch attack costs');
      }
    } catch (err) {
      setError('Failed to fetch attack costs data');
      console.error('Error fetching attack costs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all rules with attack costs
  const fetchAllRulesWithCosts = async (industry: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        industry,
        realData: 'true',
        getAllRules: 'true'
      });
      
      const response = await fetch(`/api/analytics/attack-costs?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAllRulesWithCosts(data.data.rules || []);
        setAllRulesSummary(data.data.summary || null);
      } else {
        setError(data.error || 'Failed to fetch all rules with attack costs');
      }
    } catch (err) {
      setError('Failed to fetch all rules with attack costs');
      console.error('Error fetching all rules with attack costs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'allRules') {
      fetchAllRulesWithCosts(selectedIndustry);
    } else {
      fetchAttackCosts(selectedIndustry, selectedRuleId);
    }
  }, [selectedIndustry, selectedRuleId, viewMode]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const getCostLevel = (cost: number) => {
    if (cost >= 5000000) return 'high';
    if (cost >= 2000000) return 'medium';
    return 'low';
  };

  const getCostLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCostLevelIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Target className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filter rules based on search term
  const filteredRules = allRulesWithCosts.filter(rule =>
    rule.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.ruleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.threatActors.some(actor => actor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Calculating real-time attack costs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real-Time Attack Costs</h1>
          <p className="text-gray-600 mt-2">
            Live threat intelligence-based attack cost analysis using real data sources
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Database className="h-3 w-3 mr-1" />
            Real Data
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Clock className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Industry
              </label>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(industry => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {viewMode !== 'allRules' && (
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Rule ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., sentinel-001"
                  value={selectedRuleId}
                  onChange={(e) => setSelectedRuleId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  if (viewMode === 'allRules') {
                    fetchAllRulesWithCosts(selectedIndustry);
                  } else {
                    fetchAttackCosts(selectedIndustry, selectedRuleId);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Calculate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'summary' ? 'default' : 'outline'}
            onClick={() => setViewMode('summary')}
            size="sm"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Summary
          </Button>
          <Button
            variant={viewMode === 'detailed' ? 'default' : 'outline'}
            onClick={() => setViewMode('detailed')}
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            Detailed
          </Button>
          <Button
            variant={viewMode === 'allRules' ? 'default' : 'outline'}
            onClick={() => setViewMode('allRules')}
            size="sm"
          >
            <List className="h-4 w-4 mr-2" />
            All Rules
          </Button>
        </div>
        
        {(summary || allRulesSummary) && (
          <div className="text-sm text-gray-600">
            <Database className="h-4 w-4 inline mr-1" />
            Data sources: IBM Cost of Data Breach 2024, Sophos Ransomware Report 2024, CISA Advisories
          </div>
        )}
      </div>

      {/* All Rules View */}
      {viewMode === 'allRules' && (
        <div className="space-y-6">
          {/* All Rules Summary */}
          {allRulesSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allRulesSummary.totalRules}</div>
                  <p className="text-xs text-muted-foreground">
                    Detection rules analyzed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Attack Cost</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(allRulesSummary.totalCost)}</div>
                  <p className="text-xs text-muted-foreground">
                    Combined potential cost
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(allRulesSummary.averageCost)}</div>
                  <p className="text-xs text-muted-foreground">
                    Per detection rule
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cost Range</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(allRulesSummary.minCost)} - {formatCurrency(allRulesSummary.maxCost)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Min to max cost per rule
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Search Rules
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by rule name, ID, or threat actor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {filteredRules.length} of {allRulesWithCosts.length} rules
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rules Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detection Rules with Attack Costs</CardTitle>
              <CardDescription>
                All detection rules ranked by potential attack cost impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Rule Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Rule ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Platform</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Severity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Attack Cost</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Threat Actors</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">MITRE Techniques</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRules.map((rule, index) => (
                      <tr key={rule.ruleId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{rule.ruleName}</div>
                          <div className="text-sm text-gray-500">{rule.status}</div>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{rule.ruleId}</code>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {rule.platform}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={getSeverityColor(rule.severity)}>
                            {rule.severity}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-lg text-red-600">
                            {formatCurrency(rule.attackCost)}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${getCostLevelColor(getCostLevel(rule.attackCost))} border`}
                          >
                            {getCostLevelIcon(getCostLevel(rule.attackCost))}
                            <span className="ml-1 capitalize">{getCostLevel(rule.attackCost)} Risk</span>
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {rule.threatActors.slice(0, 2).map((actor, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {actor}
                              </Badge>
                            ))}
                            {rule.threatActors.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{rule.threatActors.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {rule.mitreTechniques.slice(0, 2).map((technique, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                {technique}
                              </Badge>
                            ))}
                            {rule.mitreTechniques.length > 2 && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                +{rule.mitreTechniques.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary View */}
      {viewMode === 'summary' && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attack Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalCost)}</div>
              <p className="text-xs text-muted-foreground">
                Across {summary.totalRules} detection rules
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.averageCost)}</div>
              <p className="text-xs text-muted-foreground">
                Per detection rule
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Range</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.minCost)} - {formatCurrency(summary.maxCost)}
              </div>
              <p className="text-xs text-muted-foreground">
                Min to max cost per rule
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Distribution</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>High Risk</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {summary.costDistribution.high}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Medium Risk</span>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    {summary.costDistribution.medium}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Low Risk</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {summary.costDistribution.low}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Attack Costs */}
      {viewMode === 'detailed' && attackCosts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Detailed Attack Cost Analysis</h2>
          
          {attackCosts.map((cost, index) => (
            <Card key={cost.ruleId} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{cost.ruleName}</CardTitle>
                    <CardDescription className="text-sm">
                      Rule ID: {cost.ruleId}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(cost.totalCost)}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${getCostLevelColor(getCostLevel(cost.totalCost))} border`}
                    >
                      {getCostLevelIcon(getCostLevel(cost.totalCost))}
                      <span className="ml-1 capitalize">{getCostLevel(cost.totalCost)} Risk</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cost Breakdown */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Cost Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Base Cost</span>
                        <span className="font-medium">{formatCurrency(cost.baseCost)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Industry Cost</span>
                        <span className="font-medium">{formatCurrency(cost.industryCost)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Threat Actor Cost</span>
                        <span className="font-medium">{formatCurrency(cost.threatActorCost)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Technique Cost</span>
                        <span className="font-medium">{formatCurrency(cost.techniqueCost)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Compliance Cost</span>
                        <span className="font-medium">{formatCurrency(cost.complianceCost)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Threat Intelligence */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Threat Intelligence</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Threat Actors:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {cost.threatIntelligence.threatActors.map((actor, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {actor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">MITRE Techniques:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {cost.threatIntelligence.mitreTechniques.map((technique, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              {technique}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Confidence Score</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {cost.threatIntelligence.confidenceScore}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 