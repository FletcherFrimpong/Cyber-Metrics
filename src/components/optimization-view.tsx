'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Target, DollarSign, Clock, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface OptimizationRecommendation {
  ruleId: string;
  ruleName: string;
  platform: string;
  currentPerformance: number;
  potentialImprovement: number;
  recommendations: {
    type: 'threshold' | 'logic' | 'data_source' | 'retirement' | 'ml_enhancement';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    estimatedSavings: number;
    implementationSteps: string[];
  }[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedROI: number;
  timeToImplement: string;
}

interface OptimizationSummary {
  totalRecommendations: number;
  totalPotentialSavings: number;
  averageROI: number;
  priorityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  platformDistribution: {
    'Microsoft Sentinel': number;
    'Splunk': number;
    'CrowdStrike': number;
  };
}

interface DetectionRule {
  id: string;
  name: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Active' | 'Inactive' | 'Draft';
  platform: 'Microsoft Sentinel' | 'Splunk' | 'CrowdStrike';
  category: string;
  performanceScore: number;
  falsePositiveRate: number;
  truePositiveRate: number;
  totalAlerts: number;
  falsePositives: number;
  truePositives: number;
  lastTriggered: string;
  averageResponseTime: number;
  costPerAlert: number;
  riskScore: number;
  optimizationPriority: 'High' | 'Medium' | 'Low';
  recommendedActions: string[];
  query: string;
  queryFrequency: string;
  queryPeriod: string;
  triggerOperator: string;
  triggerThreshold: number;
  tactics: string[];
  techniques: string[];
  version: string;
  source: string;
}

export default function OptimizationView() {
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [summary, setSummary] = useState<OptimizationSummary | null>(null);
  const [detectionRules, setDetectionRules] = useState<DetectionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch optimization data
        const optParams = new URLSearchParams({
          platform: platformFilter,
          priority: priorityFilter,
          limit: '20'
        });
        
        const optResponse = await fetch(`/api/analytics/optimization?${optParams}`);
        if (!optResponse.ok) {
          throw new Error(`HTTP error! status: ${optResponse.status}`);
        }
        
        const optData = await optResponse.json();
        setRecommendations(optData.recommendations);
        setSummary(optData.summary);
        
        // Fetch detection rules data
        const rulesResponse = await fetch('/api/analytics/rules');
        if (!rulesResponse.ok) {
          throw new Error(`HTTP error! status: ${rulesResponse.status}`);
        }
        
        const rulesData = await rulesResponse.json();
        setDetectionRules(rulesData.rules || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, [platformFilter, priorityFilter]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'Microsoft Sentinel': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Splunk': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CrowdStrike': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'threshold': return <Target className="h-4 w-4" />;
      case 'logic': return <Zap className="h-4 w-4" />;
      case 'data_source': return <TrendingUp className="h-4 w-4" />;
      case 'retirement': return <AlertCircle className="h-4 w-4" />;
      case 'ml_enhancement': return <Target className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Error loading optimization data: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Performance Metrics</h2>
          <p className="text-muted-foreground">
            Comprehensive performance analysis and AI-powered optimization recommendations
          </p>
        </div>
        <Button>
          <Target className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Enhanced Performance Metrics Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-4 w-4 text-blue-600" />
            Performance Metrics Overview
          </CardTitle>
          <CardDescription className="text-sm">
            Comprehensive performance analysis and optimization metrics across all detection rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-700">
                {detectionRules.length > 0 ? 
                  (detectionRules.reduce((sum, rule) => sum + rule.performanceScore, 0) / detectionRules.length).toFixed(1) : 
                  '0.0'
                }%
              </div>
              <div className="text-sm text-blue-600">Avg Performance</div>
              <div className="text-xs text-muted-foreground mt-1">
                {detectionRules.filter(r => r.performanceScore >= 90).length} high performers
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-700">
                {detectionRules.length > 0 ? 
                  (detectionRules.reduce((sum, rule) => sum + rule.truePositives, 0)).toLocaleString() : 
                  '0'
                }
              </div>
              <div className="text-sm text-green-600">Total True Positives</div>
              <div className="text-xs text-muted-foreground mt-1">
                {detectionRules.length > 0 ? 
                  (detectionRules.reduce((sum, rule) => sum + rule.truePositiveRate, 0) / detectionRules.length * 100).toFixed(1) : 
                  '0.0'
                }% avg detection rate
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-700">
                {detectionRules.length > 0 ? 
                  (detectionRules.reduce((sum, rule) => sum + rule.falsePositives, 0)).toLocaleString() : 
                  '0'
                }
              </div>
              <div className="text-sm text-orange-600">Total False Positives</div>
              <div className="text-xs text-muted-foreground mt-1">
                {detectionRules.length > 0 ? 
                  (detectionRules.reduce((sum, rule) => sum + rule.falsePositiveRate, 0) / detectionRules.length * 100).toFixed(1) : 
                  '0.0'
                }% avg false positive rate
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-700">
                {detectionRules.length > 0 ? 
                  (detectionRules.reduce((sum, rule) => sum + rule.totalAlerts, 0)).toLocaleString() : 
                  '0'
                }
              </div>
              <div className="text-sm text-purple-600">Total Alerts</div>
              <div className="text-xs text-muted-foreground mt-1">
                {detectionRules.length > 0 ? 
                  (detectionRules.reduce((sum, rule) => sum + rule.averageResponseTime, 0) / detectionRules.length).toFixed(0) : 
                  '0'
                }ms avg response time
              </div>
            </div>
          </div>
          
          {/* Enhanced Performance Distribution */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-3">Performance Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Excellent (90-100%)</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {detectionRules.filter(r => r.performanceScore >= 90).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Good (70-89%)</span>
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    {detectionRules.filter(r => r.performanceScore >= 70 && r.performanceScore < 90).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Fair (50-69%)</span>
                  <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                    {detectionRules.filter(r => r.performanceScore >= 50 && r.performanceScore < 70).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Poor (&lt;50%)</span>
                  <Badge variant="default" className="bg-red-100 text-red-800">
                    {detectionRules.filter(r => r.performanceScore < 50).length}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-3">Alert Quality</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">True Positives</span>
                  <span className="font-medium text-green-600">
                    {(() => {
                      const totalAlerts = detectionRules.reduce((sum, rule) => sum + rule.totalAlerts, 0);
                      const totalTP = detectionRules.reduce((sum, rule) => sum + rule.truePositives, 0);
                      return totalAlerts > 0 ? ((totalTP / totalAlerts) * 100).toFixed(1) : '0.0';
                    })()}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">False Positives</span>
                  <span className="font-medium text-orange-600">
                    {(() => {
                      const totalAlerts = detectionRules.reduce((sum, rule) => sum + rule.totalAlerts, 0);
                      const totalFP = detectionRules.reduce((sum, rule) => sum + rule.falsePositives, 0);
                      return totalAlerts > 0 ? ((totalFP / totalAlerts) * 100).toFixed(1) : '0.0';
                    })()}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Precision</span>
                  <span className="font-medium text-blue-600">
                    {(() => {
                      const totalTP = detectionRules.reduce((sum, rule) => sum + rule.truePositives, 0);
                      const totalFP = detectionRules.reduce((sum, rule) => sum + rule.falsePositives, 0);
                      const total = totalTP + totalFP;
                      return total > 0 ? ((totalTP / total) * 100).toFixed(1) : '0.0';
                    })()}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-3">Risk Assessment</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">High Risk Rules</span>
                  <Badge variant="destructive">
                    {detectionRules.filter(r => r.riskScore >= 70).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Medium Risk Rules</span>
                  <Badge variant="default" className="bg-orange-100 text-orange-800">
                    {detectionRules.filter(r => r.riskScore >= 40 && r.riskScore < 70).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Low Risk Rules</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {detectionRules.filter(r => r.riskScore < 40).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg Risk Score</span>
                  <span className="font-medium">
                    {detectionRules.length > 0 ? 
                      (detectionRules.reduce((sum, rule) => sum + rule.riskScore, 0) / detectionRules.length).toFixed(0) : 
                      '0'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-3">Threat Coverage</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Rules</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {detectionRules.filter(r => r.status === 'Active').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Critical Severity</span>
                  <Badge variant="destructive">
                    {detectionRules.filter(r => r.severity === 'Critical').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">High Severity</span>
                  <Badge variant="default" className="bg-red-100 text-red-800">
                    {detectionRules.filter(r => r.severity === 'High').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">MITRE Coverage</span>
                  <Badge variant="default" className="bg-purple-100 text-purple-800">
                    {(() => {
                      const uniqueTactics = new Set(detectionRules.flatMap(r => r.tactics || []));
                      return uniqueTactics.size;
                    })()} tactics
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recommendations</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalRecommendations}</div>
              <p className="text-xs text-muted-foreground">
                AI-generated suggestions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.totalPotentialSavings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Estimated cost reduction
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.averageROI}%</div>
              <p className="text-xs text-muted-foreground">
                Return on investment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.priorityDistribution.critical}</div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="Microsoft Sentinel">Microsoft Sentinel</SelectItem>
                <SelectItem value="Splunk">Splunk</SelectItem>
                <SelectItem value="CrowdStrike">CrowdStrike</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span>Optimization Recommendations</span>
          </CardTitle>
          <CardDescription>
            AI-powered suggestions to improve detection rule performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(detectionRules || [])
              .filter(rule => rule.optimizationPriority === 'High')
              .slice(0, 6)
              .map(rule => (
                <div key={rule.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{rule.name}</span>
                    <Badge className={getPriorityColor(rule.optimizationPriority)}>
                      {rule.optimizationPriority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span>Performance: {rule.performanceScore}%</span>
                    <span className="text-red-600">FPR: {(rule.falsePositiveRate * 100).toFixed(1)}%</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Optimize
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="space-y-4">
        {recommendations.map((recommendation) => (
          <Card key={recommendation.ruleId} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{recommendation.ruleName}</span>
                    <Badge className={getPlatformColor(recommendation.platform)}>
                      {recommendation.platform}
                    </Badge>
                    <Badge className={getPriorityColor(recommendation.priority)}>
                      {recommendation.priority.toUpperCase()}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Current Performance: {recommendation.currentPerformance}% | 
                    Potential Improvement: +{recommendation.potentialImprovement}% | 
                    ROI: {recommendation.estimatedROI}%
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Time to Implement</div>
                  <div className="font-medium">{recommendation.timeToImplement}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendation.recommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(rec.type)}
                        <h4 className="font-medium">{rec.title}</h4>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${getImpactColor(rec.impact)}`}>
                          Impact: {rec.impact.toUpperCase()}
                        </div>
                        <div className={`text-sm ${getEffortColor(rec.effort)}`}>
                          Effort: {rec.effort.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm">
                        <span className="font-medium">Estimated Savings: </span>
                        <span className="text-green-600">${rec.estimatedSavings.toLocaleString()}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        Implement
                      </Button>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-2">Implementation Steps:</h5>
                      <ol className="text-sm space-y-1">
                        {rec.implementationSteps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start space-x-2">
                            <span className="text-blue-500 font-medium">{stepIndex + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No recommendations message */}
      {recommendations.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Optimization Recommendations</h3>
              <p>All detection rules are performing optimally or no recommendations match the current filters.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 