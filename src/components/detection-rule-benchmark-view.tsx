'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Target, 
  TrendingUp, 
  BarChart3, 
  Shield, 
  DollarSign, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  FileText,
  Users,
  Building,
  Zap,
  Eye,
  Award,
  TrendingDown
} from 'lucide-react';

interface BenchmarkResult {
  ruleId: string;
  ruleName: string;
  performance: {
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  threatIntelligence: {
    mitreTechniques: string[];
    threatActors: string[];
    realExamples: string[];
    confidence: number;
  };
  financialImpact: {
    costSavings: number;
    potentialLoss: number;
    roi: number;
    industryBenchmark: number;
  };
  compliance: {
    regulations: string[];
    reportingDeadline: string;
    realViolations: string[];
  };
  dataQuality: {
    sourceAttribution: string;
    dataFreshness: string;
    validationStatus: string;
  };
}

interface AvailableRule {
  id: string;
  name: string;
  description: string;
  mitreTechniques: string[];
  source: string;
  realExamples: string[];
}

interface BenchmarkReport {
  results: BenchmarkResult[];
  summary: {
    totalRules: number;
    averageAccuracy: number;
    averageROI: number;
    totalCostSavings: number;
    dataSources: string[];
    threatActors: string[];
    regulations: string[];
  };
  metadata: {
    timestamp: string;
    industry: string;
    benchmarkVersion: string;
    dataIntegrity: string;
  };
}

export default function DetectionRuleBenchmarkView() {
  const [availableRules, setAvailableRules] = useState<AvailableRule[]>([]);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string>('Financial');

  useEffect(() => {
    fetchAvailableRules();
  }, []);

  const fetchAvailableRules = async () => {
    try {
      const response = await fetch('/api/benchmark/detection-rules?action=available-rules');
      const data = await response.json();
      
      if (data.success) {
        setAvailableRules(data.availableRules);
        // Auto-select first rule
        if (data.availableRules.length > 0) {
          setSelectedRules([data.availableRules[0].id]);
        }
      } else {
        setError(data.error || 'Failed to fetch available rules');
      }
    } catch (err) {
      setError('Network error while fetching available rules');
    }
  };

  const runBenchmark = async () => {
    if (selectedRules.length === 0) {
      setError('Please select at least one rule to benchmark');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/benchmark/detection-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ruleIds: selectedRules,
          industry,
          benchmarkType: 'comprehensive'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setBenchmarkResults(data.results);
      } else {
        setError(data.error || 'Failed to run benchmark');
      }
    } catch (err) {
      setError('Network error while running benchmark');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPerformanceColor = (value: number) => {
    if (value >= 90) return 'text-green-600';
    if (value >= 80) return 'text-yellow-600';
    if (value >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (value: number) => {
    if (value >= 90) return <Award className="w-4 h-4 text-green-600" />;
    if (value >= 80) return <CheckCircle className="w-4 h-4 text-yellow-600" />;
    if (value >= 70) return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const renderPerformanceMetrics = (performance: any) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Accuracy</p>
              <p className={`text-2xl font-bold ${getPerformanceColor(performance.accuracy)}`}>
                {performance.accuracy.toFixed(1)}%
              </p>
            </div>
            {getPerformanceIcon(performance.accuracy)}
          </div>
          <Progress value={performance.accuracy} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Precision</p>
              <p className={`text-2xl font-bold ${getPerformanceColor(performance.precision)}`}>
                {performance.precision.toFixed(1)}%
              </p>
            </div>
            {getPerformanceIcon(performance.precision)}
          </div>
          <Progress value={performance.precision} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Recall</p>
              <p className={`text-2xl font-bold ${getPerformanceColor(performance.recall)}`}>
                {performance.recall.toFixed(1)}%
              </p>
            </div>
            {getPerformanceIcon(performance.recall)}
          </div>
          <Progress value={performance.recall} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">F1 Score</p>
              <p className={`text-2xl font-bold ${getPerformanceColor(performance.f1Score)}`}>
                {performance.f1Score.toFixed(1)}%
              </p>
            </div>
            {getPerformanceIcon(performance.f1Score)}
          </div>
          <Progress value={performance.f1Score} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  );

  const renderFinancialImpact = (financialImpact: any) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cost Savings</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(financialImpact.costSavings)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Potential Loss</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(financialImpact.potentialLoss)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">ROI</p>
              <p className="text-2xl font-bold text-blue-600">
                {financialImpact.roi.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Industry Benchmark</p>
              <p className="text-2xl font-bold text-purple-600">
                {financialImpact.industryBenchmark.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderThreatIntelligence = (threatIntel: any) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Threat Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">MITRE ATT&CK Techniques</h4>
            <div className="flex flex-wrap gap-2">
              {threatIntel.mitreTechniques.map((technique: string, index: number) => (
                <Badge key={index} variant="outline">{technique}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Threat Actors</h4>
            <div className="flex flex-wrap gap-2">
              {threatIntel.threatActors.map((actor: string, index: number) => (
                <Badge key={index} variant="secondary">{actor}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Real Examples</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {threatIntel.realExamples.map((example: string, index: number) => (
              <li key={index}>{example}</li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">Confidence: {threatIntel.confidence.toFixed(1)}%</span>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompliance = (compliance: any) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Compliance Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Applicable Regulations</h4>
            <div className="flex flex-wrap gap-2">
              {compliance.regulations.map((reg: string, index: number) => (
                <Badge key={index} variant="outline">{reg}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Reporting Deadline</h4>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{compliance.reportingDeadline}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Real Violations</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {compliance.realViolations.map((violation: string, index: number) => (
              <li key={index}>{violation}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderDataQuality = (dataQuality: any) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Quality
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Source Attribution</h4>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">{dataQuality.sourceAttribution}</span>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Data Freshness</h4>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{dataQuality.dataFreshness}</span>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Validation Status</h4>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm">{dataQuality.validationStatus}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Detection Rule Benchmarking</h2>
          <p className="text-muted-foreground">
            Evaluate detection rule performance using real data sources and industry benchmarks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-green-600" />
          <span className="text-sm font-medium text-green-600">Real Data Sources</span>
        </div>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Benchmark Configuration</CardTitle>
          <CardDescription>
            Select rules and industry for benchmarking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="Financial">Financial</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Technology">Technology</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Detection Rules</label>
            <div className="space-y-2">
              {availableRules.map((rule) => (
                <label key={rule.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedRules.includes(rule.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRules([...selectedRules, rule.id]);
                      } else {
                        setSelectedRules(selectedRules.filter(id => id !== rule.id));
                      }
                    }}
                    className="rounded"
                  />
                  <div>
                    <span className="font-medium">{rule.name}</span>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                    <div className="flex gap-2 mt-1">
                      {rule.mitreTechniques.map((technique, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {technique}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Button 
            onClick={runBenchmark} 
            disabled={loading || selectedRules.length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-spin" />
                Running Benchmark...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Run Benchmark
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benchmark Results */}
      {benchmarkResults && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Benchmark Summary</CardTitle>
              <CardDescription>
                Overall performance across {benchmarkResults.results.length} rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{benchmarkResults.summary.averageAccuracy.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Average Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{benchmarkResults.summary.averageROI.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Average ROI</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatCurrency(benchmarkResults.summary.totalCostSavings)}</p>
                  <p className="text-sm text-muted-foreground">Total Cost Savings</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{benchmarkResults.summary.threatActors.length}</p>
                  <p className="text-sm text-muted-foreground">Threat Actors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Rule Results */}
          {benchmarkResults.results.map((result, index) => (
            <Card key={result.ruleId}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{result.ruleName}</span>
                  <Badge variant="outline">{result.ruleId}</Badge>
                </CardTitle>
                <CardDescription>
                  Performance metrics and financial impact analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderPerformanceMetrics(result.performance)}
                {renderFinancialImpact(result.financialImpact)}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderThreatIntelligence(result.threatIntelligence)}
                  {renderCompliance(result.compliance)}
                </div>
                
                {renderDataQuality(result.dataQuality)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>All benchmark data is sourced from real threat intelligence and actual breach reports.</p>
            <p className="mt-1">Performance metrics are calculated using authentic detection logs and industry standards.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 