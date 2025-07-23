'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RuleEmbedding {
  ruleId: string;
  embedding: number[];
  ruleName: string;
  query: string;
  category: string;
  platform: string;
  similarityScore?: number;
}

interface RuleCluster {
  clusterId: string;
  centroid: number[];
  rules: RuleEmbedding[];
  similarity: number;
  overlapPercentage: number;
  redundantRules: string[];
  optimizationOpportunities: string[];
  coverageGaps: string[];
}

interface ClusteringAnalysis {
  clusters: RuleCluster[];
  totalRules: number;
  redundantRules: number;
  coverageGaps: number;
  optimizationScore: number;
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

interface SimilarityMatrix {
  ruleId: string;
  similarities: Record<string, number>;
  averageSimilarity: number;
  mostSimilar: string[];
}

export default function RuleClusteringView() {
  const [analysis, setAnalysis] = useState<ClusteringAnalysis | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<RuleCluster | null>(null);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [similarityMatrix, setSimilarityMatrix] = useState<SimilarityMatrix[]>([]);

  useEffect(() => {
    loadClusteringAnalysis();
  }, [similarityThreshold]);

  const loadClusteringAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rule-clustering?action=cluster-rules&threshold=${similarityThreshold}`);
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Error loading clustering analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateEmbeddings = async () => {
    setLoading(true);
    try {
      await fetch('/api/rule-clustering?action=generate-embeddings');
      await loadClusteringAnalysis();
    } catch (error) {
      console.error('Error generating embeddings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity > 0.8) return 'text-red-600';
    if (similarity > 0.6) return 'text-orange-600';
    return 'text-green-600';
  };

  const getSimilarityBackground = (similarity: number) => {
    if (similarity > 0.8) return 'bg-red-100';
    if (similarity > 0.6) return 'bg-orange-100';
    return 'bg-green-100';
  };

  const getOverlapColor = (overlap: number) => {
    if (overlap > 70) return 'text-red-600';
    if (overlap > 40) return 'text-orange-600';
    return 'text-green-600';
  };

  const getOptimizationScoreColor = (score: number) => {
    if (score < 50) return 'text-red-600';
    if (score < 75) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rule Clustering Analysis</h1>
          <p className="text-muted-foreground">
            Visualize detection rule similarities and identify optimization opportunities
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Similarity Threshold:</label>
            <input
              type="range"
              min="0.5"
              max="0.9"
              step="0.1"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-sm">{similarityThreshold}</span>
          </div>
          <Button onClick={generateEmbeddings} disabled={loading}>
            Generate Embeddings
          </Button>
          <Button onClick={loadClusteringAnalysis} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Analysis'}
          </Button>
        </div>
      </div>

      {analysis && (
        <>
          {/* Analysis Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysis.totalRules}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Clusters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysis.clusters.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Redundant Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${analysis.redundantRules > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {analysis.redundantRules}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Optimization Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getOptimizationScoreColor(analysis.optimizationScore)}`}>
                  {analysis.optimizationScore.toFixed(0)}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rule Clusters */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Rule Clusters</CardTitle>
                  <CardDescription>
                    Groups of similar detection rules
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.clusters.map((cluster) => (
                    <div
                      key={cluster.clusterId}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedCluster?.clusterId === cluster.clusterId ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCluster(cluster)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Cluster {cluster.clusterId.split('-')[1]}</h3>
                        <Badge variant={cluster.rules.length > 3 ? 'destructive' : 'secondary'}>
                          {cluster.rules.length} rules
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Similarity:</span>
                          <span className={`font-semibold ${getSimilarityColor(cluster.similarity)}`}>
                            {(cluster.similarity * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={cluster.similarity * 100} className="h-2" />
                        
                        <div className="flex items-center justify-between text-sm">
                          <span>Overlap:</span>
                          <span className={`font-semibold ${getOverlapColor(cluster.overlapPercentage)}`}>
                            {cluster.overlapPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={cluster.overlapPercentage} className="h-2" />
                        
                        {cluster.redundantRules.length > 0 && (
                          <div className="text-xs text-red-600">
                            {cluster.redundantRules.length} redundant rules
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Cluster Details */}
            <div className="lg:col-span-2">
              {selectedCluster ? (
                <div className="space-y-6">
                  {/* Cluster Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Cluster Analysis</CardTitle>
                      <CardDescription>
                        Detailed analysis of selected cluster
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold mb-3">Cluster Metrics</h3>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Average Similarity</span>
                                <span>{(selectedCluster.similarity * 100).toFixed(1)}%</span>
                              </div>
                              <Progress value={selectedCluster.similarity * 100} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Query Overlap</span>
                                <span>{selectedCluster.overlapPercentage.toFixed(1)}%</span>
                              </div>
                              <Progress value={selectedCluster.overlapPercentage} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Redundant Rules</span>
                                <span>{selectedCluster.redundantRules.length}</span>
                              </div>
                              <Progress value={Math.min(100, selectedCluster.redundantRules.length * 20)} className="h-2" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Optimization Opportunities</h3>
                          <div className="space-y-2">
                            {selectedCluster.optimizationOpportunities.map((opportunity, index) => (
                              <div key={index} className="text-sm p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                                {opportunity}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rules in Cluster */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Rules in Cluster</CardTitle>
                      <CardDescription>
                        Individual rules and their similarity scores
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedCluster.rules.map((rule) => (
                          <div
                            key={rule.ruleId}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedRule === rule.ruleId ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedRule(rule.ruleId)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{rule.ruleName}</h4>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">{rule.category}</Badge>
                                <Badge variant="outline">{rule.platform}</Badge>
                                {rule.similarityScore && (
                                  <span className={`text-sm font-semibold ${getSimilarityColor(rule.similarityScore)}`}>
                                    {(rule.similarityScore * 100).toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{rule.ruleId}</p>
                            <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                              {rule.query.substring(0, 100)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Cluster Analysis</CardTitle>
                    <CardDescription>
                      Select a cluster to view detailed analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                      Choose a cluster from the left panel to analyze its rules and optimization opportunities
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>
                Actionable recommendations based on clustering analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {analysis.recommendations.immediate.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-red-600 mb-3">Immediate Actions</h3>
                    <ul className="space-y-2">
                      {analysis.recommendations.immediate.map((rec, i) => (
                        <li key={i} className="text-sm flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysis.recommendations.shortTerm.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-orange-600 mb-3">Short Term</h3>
                    <ul className="space-y-2">
                      {analysis.recommendations.shortTerm.map((rec, i) => (
                        <li key={i} className="text-sm flex items-start">
                          <span className="text-orange-500 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysis.recommendations.longTerm.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-blue-600 mb-3">Long Term</h3>
                    <ul className="space-y-2">
                      {analysis.recommendations.longTerm.map((rec, i) => (
                        <li key={i} className="text-sm flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Similarity Matrix Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Rule Similarity Matrix</CardTitle>
              <CardDescription>
                Heatmap showing similarity between all rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  <div className="grid grid-cols-11 gap-1 mb-2">
                    <div className="font-medium text-sm p-2">Rule</div>
                    {analysis.clusters.slice(0, 10).map((cluster, i) => (
                      <div key={i} className="font-medium text-xs p-2 text-center">
                        C{i + 1}
                      </div>
                    ))}
                  </div>
                  
                  {analysis.clusters.slice(0, 10).map((cluster, i) => (
                    <div key={i} className="grid grid-cols-11 gap-1 mb-1">
                      <div className="text-sm p-2 font-medium">C{i + 1}</div>
                      {analysis.clusters.slice(0, 10).map((otherCluster, j) => {
                        const similarity = i === j ? 1.0 : 
                          cluster.rules.some(r1 => 
                            otherCluster.rules.some(r2 => 
                              r1.ruleId === r2.ruleId
                            )
                          ) ? 0.5 : 0.0;
                        
                        return (
                          <div
                            key={j}
                            className={`text-xs p-2 text-center ${getSimilarityBackground(similarity)}`}
                            style={{ opacity: similarity }}
                          >
                            {similarity > 0 ? similarity.toFixed(1) : ''}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 