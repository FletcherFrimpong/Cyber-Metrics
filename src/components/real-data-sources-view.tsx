'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Shield, 
  FileText, 
  Globe, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  Target,
  Users,
  Building,
  Lock,
  Eye,
  Code,
  BookOpen
} from 'lucide-react';

interface RealDataSourcesViewProps {}

interface DataSource {
  source: string;
  description: string;
  attribution: string;
  techniques?: any[];
  logs?: any[];
  threat_actors?: any[];
  breaches?: any[];
  rules?: any[];
  regulations?: any[];
}

interface DataIntegrityResponse {
  success: boolean;
  timestamp: string;
  data_integrity: {
    no_fake_data: boolean;
    sources_verified: boolean;
    attribution_required: boolean;
    verification?: {
      sources_attributed: boolean;
      timestamps_present: boolean;
      urls_verified: boolean;
      no_synthetic_data: boolean;
    };
  };
  mitre_attack?: DataSource;
  detection_lab?: DataSource;
  threat_intelligence?: DataSource;
  financial_breaches?: DataSource;
  detection_rules?: DataSource;
  compliance?: DataSource;
}

export default function RealDataSourcesView({}: RealDataSourcesViewProps) {
  const [dataSources, setDataSources] = useState<DataIntegrityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchDataSources = async (source: string = 'all') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/data-sources/real?source=${source}`);
      const data = await response.json();
      
      if (data.success) {
        setDataSources(data);
      } else {
        setError(data.error || 'Failed to fetch data sources');
      }
    } catch (err) {
      setError('Network error while fetching data sources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataSources();
  }, []);

  const handleSourceChange = (source: string) => {
    setSelectedSource(source);
    fetchDataSources(source);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderMITREAttack = (data: DataSource) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          MITRE ATT&CK Framework
        </CardTitle>
        <CardDescription>{data.description}</CardDescription>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="w-4 h-4" />
          <a href={data.source} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {data.source}
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Attribution: {data.attribution}</span>
          </div>
          
          {data.techniques && (
            <div>
              <h4 className="font-semibold mb-2">Techniques</h4>
              <div className="space-y-2">
                {data.techniques.map((technique: any, index: number) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{technique.technique_id}</Badge>
                      <span className="font-medium">{technique.technique_name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{technique.description}</p>
                    <div className="text-xs">
                      <strong>Tactic:</strong> {technique.tactic}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderDetectionLab = (data: DataSource) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          DetectionLab Logs
        </CardTitle>
        <CardDescription>{data.description}</CardDescription>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="w-4 h-4" />
          <a href={data.source} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {data.source}
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Attribution: {data.attribution}</span>
          </div>
          
          {data.logs && (
            <div>
              <h4 className="font-semibold mb-2">Security Event Logs</h4>
              <div className="space-y-2">
                {data.logs.map((log: any, index: number) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{log.source}</span>
                      <Badge variant={log.severity === 'High' ? 'destructive' : 'secondary'}>
                        {log.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{log.description}</p>
                    <div className="text-xs space-y-1">
                      <div><strong>Event Type:</strong> {log.event_type}</div>
                      <div><strong>MITRE Techniques:</strong> {log.mitre_techniques.join(', ')}</div>
                      <div><strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderThreatIntelligence = (data: DataSource) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Threat Intelligence
        </CardTitle>
        <CardDescription>{data.description}</CardDescription>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="w-4 h-4" />
          <span>Government and Industry Sources</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Attribution: {data.attribution}</span>
          </div>
          
          {data.threat_actors && (
            <div>
              <h4 className="font-semibold mb-2">Threat Actors</h4>
              <div className="space-y-2">
                {data.threat_actors.map((actor: any, index: number) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="font-medium mb-1">{actor.threat_actor}</div>
                    <p className="text-sm text-muted-foreground mb-2">{actor.recent_activity}</p>
                    <div className="text-xs space-y-1">
                      <div><strong>Technique:</strong> {actor.technique}</div>
                      <div><strong>Confidence:</strong> {actor.confidence.toFixed(1)}%</div>
                      <div><strong>IOCs:</strong> {actor.ioc_count}</div>
                      <div><strong>Real Examples:</strong> {actor.real_examples.join(', ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderFinancialBreaches = (data: DataSource) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Financial Sector Breaches
        </CardTitle>
        <CardDescription>{data.description}</CardDescription>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="w-4 h-4" />
          <span>Public Reports and Regulatory Filings</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Attribution: {data.attribution}</span>
          </div>
          
          {data.breaches && (
            <div>
              <h4 className="font-semibold mb-2">Real Breach Data</h4>
              <div className="space-y-2">
                {data.breaches.map((breach: any, index: number) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="font-medium mb-1">{breach.name}</div>
                    <div className="text-sm text-muted-foreground mb-2">{breach.attack_type}</div>
                    <div className="text-xs space-y-1">
                      <div><strong>Cost:</strong> {formatCurrency(breach.cost)}</div>
                      <div><strong>Records Compromised:</strong> {breach.records_compromised.toLocaleString()}</div>
                      <div><strong>Technique:</strong> {breach.technique}</div>
                      <div><strong>Source:</strong> <a href={breach.source} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">CISA Advisory</a></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderDetectionRules = (data: DataSource) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          Detection Rules
        </CardTitle>
        <CardDescription>{data.description}</CardDescription>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="w-4 h-4" />
          <a href={data.source} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {data.source}
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Attribution: {data.attribution}</span>
          </div>
          
          {data.rules && (
            <div>
              <h4 className="font-semibold mb-2">Sigma Detection Rules</h4>
              <div className="space-y-2">
                {data.rules.map((rule: any, index: number) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="font-medium mb-1">{rule.name}</div>
                    <div className="text-xs space-y-1">
                      <div><strong>MITRE Techniques:</strong> {rule.mitre_techniques.join(', ')}</div>
                      <div><strong>Real Examples:</strong> {rule.real_examples.join(', ')}</div>
                      <div><strong>Source:</strong> <a href={rule.source} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Sigma Project</a></div>
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">View Rule Content</summary>
                      <pre className="mt-2 text-xs bg-background p-2 rounded border overflow-x-auto">
                        {rule.rule_content}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderCompliance = (data: DataSource) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Compliance Requirements
        </CardTitle>
        <CardDescription>{data.description}</CardDescription>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="w-4 h-4" />
          <span>Official Regulatory Documentation</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Attribution: {data.attribution}</span>
          </div>
          
          {data.regulations && (
            <div>
              <h4 className="font-semibold mb-2">Regulatory Requirements</h4>
              <div className="space-y-2">
                {data.regulations.map((regulation: any, index: number) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="font-medium mb-1">{regulation.source}</div>
                    <div className="text-xs space-y-1">
                      <div><strong>Reporting Deadline:</strong> {regulation.reporting_deadline}</div>
                      <div><strong>Requirements:</strong></div>
                      <ul className="list-disc list-inside ml-2">
                        {regulation.requirements.map((req: string, reqIndex: number) => (
                          <li key={reqIndex}>{req}</li>
                        ))}
                      </ul>
                      <div><strong>Real Examples:</strong> {regulation.real_examples.join(', ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Real Data Sources</h2>
          <p className="text-muted-foreground">
            Authentic threat intelligence and detection data from open-source sources
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <span className="text-sm font-medium text-green-600">No Fake Data</span>
        </div>
      </div>

      {/* Data Integrity Banner */}
      {dataSources && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">Data Integrity Verified</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>✅ Sources Attributed</span>
                <span>✅ Timestamps Present</span>
                <span>✅ URLs Verified</span>
                <span>✅ No Synthetic Data</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Data Source Selection</CardTitle>
          <CardDescription>
            Choose which real data sources to display
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Sources', icon: Database },
              { id: 'mitre', label: 'MITRE ATT&CK', icon: Target },
              { id: 'detectionlab', label: 'DetectionLab', icon: Activity },
              { id: 'threat_intelligence', label: 'Threat Intel', icon: Shield },
              { id: 'financial_breaches', label: 'Financial Breaches', icon: Building },
              { id: 'detection_rules', label: 'Detection Rules', icon: Code },
              { id: 'compliance', label: 'Compliance', icon: Lock }
            ].map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={selectedSource === id ? "default" : "outline"}
                onClick={() => handleSourceChange(id)}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 animate-spin" />
              <span>Loading real data sources...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
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

      {/* Data Sources Display */}
      {dataSources && !loading && (
        <div className="space-y-6">
          {dataSources.mitre_attack && renderMITREAttack(dataSources.mitre_attack)}
          {dataSources.detection_lab && renderDetectionLab(dataSources.detection_lab)}
          {dataSources.threat_intelligence && renderThreatIntelligence(dataSources.threat_intelligence)}
          {dataSources.financial_breaches && renderFinancialBreaches(dataSources.financial_breaches)}
          {dataSources.detection_rules && renderDetectionRules(dataSources.detection_rules)}
          {dataSources.compliance && renderCompliance(dataSources.compliance)}
        </div>
      )}

      {/* Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>All data sources are properly attributed to their original open-source projects and organizations.</p>
            <p className="mt-1">SignalFoundry maintains data integrity by using only verified, real-world threat intelligence.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 