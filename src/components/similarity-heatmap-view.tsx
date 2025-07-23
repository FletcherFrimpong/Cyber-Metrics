'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, TrendingUp, DollarSign, Target, RefreshCw, Activity } from 'lucide-react'

interface RuleSimilarity {
  ruleId1: string;
  ruleId2: string;
  similarityScore: number;
  overlapAreas: string[];
  commonTechniques: string[];
  commonThreatActors: string[];
  commonCompliance: string[];
  consolidationPotential: 'high' | 'medium' | 'low';
  consolidationRecommendation: string;
}

interface RuleCluster {
  id: string;
  name: string;
  rules: string[];
  similarity: number;
  color: string;
  commonTechniques: string[];
  commonThreatActors: string[];
  consolidationOpportunities: string[];
  estimatedSavings: number;
}

interface SimilarityAnalysis {
  rules: string[];
  similarityMatrix: number[][];
  clusters: RuleCluster[];
  consolidationOpportunities: {
    high: number;
    medium: number;
    low: number;
  };
  estimatedCostSavings: number;
  recommendations: string[];
}

export function SimilarityHeatmapView() {
  const [analysis, setAnalysis] = useState<SimilarityAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<RuleCluster | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSimilarityAnalysis();
  }, []);

  const loadSimilarityAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading real-time similarity analysis...');
      const response = await fetch('/api/similarity?action=analyze');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Similarity analysis loaded successfully');
        console.log(`Found ${result.data.clusters.length} clusters`);
        console.log(`Estimated savings: $${result.data.estimatedCostSavings.toLocaleString()}`);
        setAnalysis(result.data);
      } else {
        throw new Error(result.error || 'Failed to load similarity analysis');
      }
    } catch (error) {
      console.error('Error loading similarity analysis:', error);
      setError(error instanceof Error ? error.message : 'Failed to load similarity analysis');
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalysis = async () => {
    setRefreshing(true);
    await loadSimilarityAnalysis();
    setRefreshing(false);
  };

  const getHeatmapColor = (similarity: number) => {
    if (similarity >= 0.8) return "bg-red-500"
    if (similarity >= 0.6) return "bg-orange-500"
    if (similarity >= 0.4) return "bg-yellow-500"
    if (similarity >= 0.2) return "bg-blue-500"
    return "bg-gray-300 dark:bg-gray-700"
  }

  const getHeatmapOpacity = (similarity: number) => {
    return Math.max(0.1, similarity)
  }

  const getConsolidationColor = (potential: 'high' | 'medium' | 'low') => {
    switch (potential) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Clusters & Similarities</h2>
            <p className="text-muted-foreground">
              Analyzing rule similarities and identifying consolidation opportunities
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading real-time similarity analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Clusters & Similarities</h2>
            <p className="text-muted-foreground">
              Analyze rule similarities and identify potential consolidation opportunities
            </p>
          </div>
          <Button onClick={refreshAnalysis} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold">Error Loading Analysis</h3>
            </div>
            <p className="text-red-600 mt-2">{error}</p>
            <Button onClick={refreshAnalysis} className="mt-4" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Clusters & Similarities</h2>
            <p className="text-muted-foreground">
              Analyze rule similarities and identify potential consolidation opportunities
            </p>
          </div>
          <Button onClick={refreshAnalysis} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No similarity analysis available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clusters & Similarities</h2>
          <p className="text-muted-foreground">
            Real-time analysis of rule similarities and consolidation opportunities
          </p>
        </div>
        <Button onClick={refreshAnalysis} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{analysis.rules.length}</p>
                <p className="text-sm text-muted-foreground">Total Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{analysis.clusters.length}</p>
                <p className="text-sm text-muted-foreground">Clusters</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{analysis.consolidationOpportunities.high}</p>
                <p className="text-sm text-muted-foreground">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">${(analysis.estimatedCostSavings / 1000).toFixed(0)}k</p>
                <p className="text-sm text-muted-foreground">Est. Savings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clusters Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {analysis.clusters.map((cluster) => (
          <Card 
            key={cluster.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedCluster?.id === cluster.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedCluster(selectedCluster?.id === cluster.id ? null : cluster)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${cluster.color}`} />
                {cluster.name}
              </CardTitle>
              <CardDescription>
                {cluster.rules.length} rules • {(cluster.similarity * 100).toFixed(1)}% similarity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {cluster.rules.map((ruleId) => (
                    <Badge key={ruleId} variant="outline" className="text-xs">
                      {ruleId}
                    </Badge>
                  ))}
                </div>
                
                {cluster.commonTechniques.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Common Techniques:</p>
                    <div className="flex flex-wrap gap-1">
                      {cluster.commonTechniques.slice(0, 3).map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {cluster.commonTechniques.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{cluster.commonTechniques.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {cluster.estimatedSavings > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      ${cluster.estimatedSavings.toLocaleString()} savings
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Cluster Details */}
      {selectedCluster && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${selectedCluster.color}`} />
              {selectedCluster.name} - Detailed Analysis
            </CardTitle>
            <CardDescription>
              Consolidation opportunities and recommendations for this cluster
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Common Threat Actors</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedCluster.commonThreatActors.length > 0 ? (
                    selectedCluster.commonThreatActors.map((actor) => (
                      <Badge key={actor} variant="outline">
                        {actor}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No common threat actors identified</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Consolidation Opportunities</h4>
                <div className="space-y-2">
                  {selectedCluster.consolidationOpportunities.length > 0 ? (
                    selectedCluster.consolidationOpportunities.map((opportunity, index) => (
                      <div key={index} className="text-sm p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                        {opportunity}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No specific consolidation opportunities identified</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Similarity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Rule Similarity Matrix</CardTitle>
          <CardDescription>
            Real-time similarity analysis based on MITRE techniques, threat actors, and compliance requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <TooltipProvider>
              <div className="inline-block min-w-full">
                {/* Header row */}
                <div className="flex">
                  <div className="w-20 h-8 flex items-center justify-center text-xs font-medium">Rules</div>
                  {analysis.rules.map((rule) => (
                    <div key={rule} className="w-16 h-8 flex items-center justify-center text-xs font-medium">
                      {rule.split("-")[1] || rule}
                    </div>
                  ))}
                </div>

                {/* Matrix rows */}
                {analysis.rules.map((rowRule, rowIndex) => (
                  <div key={rowRule} className="flex">
                    <div className="w-20 h-8 flex items-center justify-center text-xs font-medium">{rowRule}</div>
                    {analysis.rules.map((colRule, colIndex) => {
                      const similarity = analysis.similarityMatrix[rowIndex][colIndex]
                      return (
                        <Tooltip key={colRule}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-16 h-8 border border-gray-200 dark:border-gray-700 cursor-pointer hover:ring-2 hover:ring-primary ${getHeatmapColor(similarity)}`}
                              style={{ opacity: getHeatmapOpacity(similarity) }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p className="font-medium">
                                {rowRule} ↔ {colRule}
                              </p>
                              <p>Similarity: {(similarity * 100).toFixed(1)}%</p>
                              {similarity > 0.7 && <p className="text-yellow-400">High overlap detected</p>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center gap-4 text-sm">
            <span className="font-medium">Similarity:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700" />
              <span>Low (0-20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500" />
              <span>Medium (20-40%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500" />
              <span>High (40-60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500" />
              <span>Very High (60-80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500" />
              <span>Extreme (80-100%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Consolidation Recommendations</CardTitle>
            <CardDescription>
              AI-generated recommendations based on real-time similarity analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recommendations.map((recommendation, index) => (
                <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
