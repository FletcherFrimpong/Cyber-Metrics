'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface KnotSegment {
  id: string;
  ruleId: string;
  name: string;
  type: 'filter' | 'aggregation' | 'threshold' | 'condition';
  query: string;
  description: string;
  position: number;
  dependencies: string[];
  complexity: 'low' | 'medium' | 'high';
}

interface KnotPerformance {
  knotId: string;
  ruleId: string;
  falsePositiveRate: number;
  truePositiveRate: number;
  totalTriggers: number;
  falsePositives: number;
  truePositives: number;
  averageResponseTime: number;
  lastTriggered: string;
  confidence: number;
  tuningRecommendations: string[];
  falsePositiveScore: number;
  falsePositiveTrend: 'improving' | 'stable' | 'worsening';
  falsePositivePatterns: any[];
  noiseLevel: 'low' | 'medium' | 'high';
  alertFatigue: number;
  tuningPriority: 'low' | 'medium' | 'high' | 'critical';
}

interface FalsePositiveAnalysis {
  knotId: string;
  overallScore: number;
  patternAnalysis: {
    commonPatterns: any[];
    seasonalTrends: any[];
    timeBasedPatterns: any[];
  };
  impactAssessment: {
    alertFatigue: number;
    analystTimeWaste: number;
    costImpact: number;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export default function KnotScoringView() {
  const [selectedRule, setSelectedRule] = useState('sentinel-001');
  const [knots, setKnots] = useState<KnotSegment[]>([]);
  const [performances, setPerformances] = useState<KnotPerformance[]>([]);
  const [selectedKnot, setSelectedKnot] = useState<string | null>(null);
  const [falsePositiveAnalysis, setFalsePositiveAnalysis] = useState<FalsePositiveAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const rules = [
    { id: 'sentinel-001', name: 'ALPHV/BlackCat Ransomware Activity' },
    { id: 'sentinel-002', name: 'LockBit Ransomware Initial Access' }
  ];

  useEffect(() => {
    loadKnots();
  }, [selectedRule]);

  const loadKnots = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/knot-scoring?action=parse-rule&ruleId=${selectedRule}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'parse-rule', ruleId: selectedRule })
      });
      const data = await response.json();
      setKnots(data.knots || []);
      
      // Load performance data for each knot using real data
      const performancePromises = data.knots.map((knot: KnotSegment) =>
        fetch('/api/knot-scoring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'score-performance', 
            ruleId: knot.ruleId, 
            knotId: knot.id
          })
        }).then(res => res.json())
      );
      
      const performanceResults = await Promise.all(performancePromises);
      setPerformances(performanceResults);
    } catch (error) {
      console.error('Error loading knots:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFalsePositiveAnalysis = async (knotId: string) => {
    try {
      const response = await fetch(`/api/knot-scoring?action=analyze-false-positives&knotId=${knotId}`);
      const analysis = await response.json();
      setFalsePositiveAnalysis(analysis);
    } catch (error) {
      console.error('Error loading false positive analysis:', error);
    }
  };

  // Real-time data integration - no more mock data
  const loadRealKnotData = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/knot-scoring?action=extract-knots&ruleId=${ruleId}`);
      if (response.ok) {
        const data = await response.json();
        return data.knots || [];
      }
    } catch (error) {
      console.error('Error loading real knot data:', error);
    }
    return [];
  };

  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score < 30) return 'bg-green-100';
    if (score < 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '↗️';
      case 'worsening': return '↘️';
      default: return '→';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knot Logic Scoring Engine</h1>
          <p className="text-muted-foreground">
            Analyze detection rule segments and their false positive patterns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Rule:</label>
          <select
            value={selectedRule}
            onChange={(e) => setSelectedRule(e.target.value)}
            className="border rounded px-3 py-1"
          >
            {rules.map(rule => (
              <option key={rule.id} value={rule.id}>{rule.name}</option>
            ))}
          </select>
          <Button onClick={loadKnots} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Knot Segments */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Rule Segments (Knots)</CardTitle>
              <CardDescription>
                Individual logic components of the detection rule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {knots.map((knot) => {
                const performance = performances.find(p => p.knotId === knot.id);
                return (
                  <div
                    key={knot.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedKnot === knot.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedKnot(knot.id);
                      loadFalsePositiveAnalysis(knot.id);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{knot.name}</h3>
                      <Badge variant={knot.complexity === 'high' ? 'destructive' : knot.complexity === 'medium' ? 'secondary' : 'default'}>
                        {knot.complexity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{knot.description}</p>
                    <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                      {knot.query}
                    </div>
                    {performance && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>False Positive Score:</span>
                          <span className={`font-semibold ${getScoreColor(performance.falsePositiveScore)}`}>
                            {performance.falsePositiveScore}/100
                          </span>
                        </div>
                        <Progress value={performance.falsePositiveScore} className="h-2" />
                        <div className="flex items-center justify-between text-xs">
                          <span>Noise: {performance.noiseLevel}</span>
                          <span>Priority: {performance.tuningPriority}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* False Positive Analysis */}
        <div className="lg:col-span-2">
          {selectedKnot && falsePositiveAnalysis ? (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle>False Positive Analysis</CardTitle>
                  <CardDescription>
                    Comprehensive analysis of false positive patterns and impact
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className={`p-4 rounded-lg ${getScoreBackground(falsePositiveAnalysis.overallScore || 0)}`}>
                      <div className="text-2xl font-bold text-center mb-2">
                        {falsePositiveAnalysis.overallScore || 0}/100
                      </div>
                      <div className="text-center text-sm font-medium">Overall Score</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-center mb-2">
                        ${(falsePositiveAnalysis.impactAssessment.costImpact || 0).toFixed(0)}
                      </div>
                      <div className="text-center text-sm font-medium">Cost Impact</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-center mb-2">
                        {(falsePositiveAnalysis.impactAssessment.analystTimeWaste || 0).toFixed(0)}m
                      </div>
                      <div className="text-center text-sm font-medium">Time Waste</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Impact Assessment */}
                    <div>
                      <h3 className="font-semibold mb-3">Impact Assessment</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Alert Fatigue</span>
                            <span>{(falsePositiveAnalysis.impactAssessment.alertFatigue || 0).toFixed(1)}%</span>
                          </div>
                          <Progress value={falsePositiveAnalysis.impactAssessment.alertFatigue || 0} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Analyst Time Waste</span>
                            <span>{(falsePositiveAnalysis.impactAssessment.analystTimeWaste || 0).toFixed(0)} minutes</span>
                          </div>
                          <Progress value={Math.min(100, (falsePositiveAnalysis.impactAssessment.analystTimeWaste || 0) / 10)} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Cost Impact</span>
                            <span>${(falsePositiveAnalysis.impactAssessment.costImpact || 0).toFixed(0)}</span>
                          </div>
                          <Progress value={Math.min(100, (falsePositiveAnalysis.impactAssessment.costImpact || 0) / 50)} className="h-2" />
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h3 className="font-semibold mb-3">Recommendations</h3>
                      <div className="space-y-3">
                        {falsePositiveAnalysis.recommendations.immediate.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-red-600 mb-1">Immediate Actions</h4>
                            <ul className="text-sm space-y-1">
                              {falsePositiveAnalysis.recommendations.immediate.map((rec, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="text-red-500 mr-2">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {falsePositiveAnalysis.recommendations.shortTerm.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-orange-600 mb-1">Short Term</h4>
                            <ul className="text-sm space-y-1">
                              {falsePositiveAnalysis.recommendations.shortTerm.map((rec, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="text-orange-500 mr-2">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {falsePositiveAnalysis.recommendations.longTerm.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-blue-600 mb-1">Long Term</h4>
                            <ul className="text-sm space-y-1">
                              {falsePositiveAnalysis.recommendations.longTerm.map((rec, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="text-blue-500 mr-2">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pattern Analysis */}
              {falsePositiveAnalysis.patternAnalysis.commonPatterns.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Common False Positive Patterns</CardTitle>
                    <CardDescription>
                      Recurring patterns that cause false positives
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {falsePositiveAnalysis.patternAnalysis.commonPatterns.map((pattern, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{pattern.pattern}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant={pattern.impact === 'high' ? 'destructive' : pattern.impact === 'medium' ? 'secondary' : 'default'}>
                                {pattern.impact} impact
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {pattern.frequency} occurrences
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Last seen: {new Date(pattern.lastSeen).toLocaleDateString()}
                          </p>
                          <div className="text-sm">
                            <strong>Mitigation:</strong> {pattern.mitigation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>False Positive Analysis</CardTitle>
                <CardDescription>
                  Select a knot segment to view detailed false positive analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  Choose a knot from the left panel to analyze its false positive patterns
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Performance Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics Summary</CardTitle>
          <CardDescription>
            Overview of all knot segments and their performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Knot</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">False Positive Score</th>
                  <th className="text-left p-2">Noise Level</th>
                  <th className="text-left p-2">Tuning Priority</th>
                  <th className="text-left p-2">Trend</th>
                  <th className="text-left p-2">Alert Fatigue</th>
                </tr>
              </thead>
              <tbody>
                {performances.map((performance) => {
                  const knot = knots.find(k => k.id === performance.knotId);
                  return (
                    <tr key={performance.knotId} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{knot?.name || performance.knotId}</td>
                      <td className="p-2">
                        <Badge variant="outline">{knot?.type || 'unknown'}</Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                                                  <span className={`font-semibold ${getScoreColor(performance.falsePositiveScore || 0)}`}>
                          {performance.falsePositiveScore || 0}
                        </span>
                        <Progress value={performance.falsePositiveScore || 0} className="w-16 h-2" />
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant={performance.noiseLevel === 'high' ? 'destructive' : performance.noiseLevel === 'medium' ? 'secondary' : 'default'}>
                          {performance.noiseLevel}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge className={getPriorityColor(performance.tuningPriority)}>
                          {performance.tuningPriority}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <span className="text-lg">{getTrendIcon(performance.falsePositiveTrend)}</span>
                        <span className="ml-1 text-sm capitalize">{performance.falsePositiveTrend}</span>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{(performance.alertFatigue || 0).toFixed(1)}%</span>
                          <Progress value={performance.alertFatigue || 0} className="w-16 h-2" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 