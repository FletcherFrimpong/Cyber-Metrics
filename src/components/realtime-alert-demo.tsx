'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Activity, 
  Clock, 
  Target, 
  Zap,
  Play,
  Pause,
  RotateCcw,
  Eye,
  FileText,
  Users,
  Building,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingDown,
  BarChart3,
  Target as TargetIcon,
  Zap as ZapIcon
} from 'lucide-react';

interface FinancialAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  timestamp: string;
  status: 'Active' | 'Investigating' | 'Resolved' | 'False Positive';
  description: string;
  value: {
    immediateValue: number;
    potentialLoss: number;
    roiPercentage: number;
    costSavings: number;
    industryImpact: number;
    realTimeValue: number;
    threatBasedValue: number;
    attackCostValue: number;
  };
  threatIntelligence: {
    threatActor: string;
    technique: string;
    tactic: string;
    confidence: number;
    iocCount: number;
    recentActivity: string;
    realThreatData: {
      recentAttacks: string[];
      averageCost: number;
      industryTargets: string[];
      attackFrequency: number;
    };
  };
  affectedSystems: {
    systemName: string;
    systemType: string;
    riskLevel: string;
    dataExposed: string[];
  }[];
  recommendedActions: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  compliance: {
    regulations: string[];
    impact: string;
    reportingRequired: boolean;
  };
  metrics: {
    responseTime: number;
    falsePositiveProbability: number;
    truePositiveConfidence: number;
    historicalAccuracy: number;
  };
  realTimeMetrics: {
    currentThreatLevel: number;
    attackProbability: number;
    timeToImpact: number;
    financialExposure: number;
    industryRiskMultiplier: number;
  };
}

interface DashboardData {
  recentAlerts: FinancialAlert[];
  summary: {
    totalAlerts: number;
    totalValue: number;
    totalSavings: number;
    averageROI: number;
    criticalAlerts: number;
    activeThreats: number;
    realTimeValue: number;
    threatBasedValue: number;
    attackCostValue: number;
  };
  threatActors: string[];
  complianceImpact: number;
  realTimeThreats: {
    activeThreatActors: number;
    currentAttackCosts: number;
    industryRiskLevel: number;
    timeToNextAttack: number;
  };
}

export default function RealtimeAlertDemo() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<FinancialAlert | null>(null);
  const [alertHistory, setAlertHistory] = useState<FinancialAlert[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [streamingInterval, setStreamingInterval] = useState<NodeJS.Timeout | null>(null);
  const [valueAccumulator, setValueAccumulator] = useState(0);
  const [savingsAccumulator, setSavingsAccumulator] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [realTimeValueAccumulator, setRealTimeValueAccumulator] = useState(0);
  const [threatBasedValueAccumulator, setThreatBasedValueAccumulator] = useState(0);
  const [attackCostValueAccumulator, setAttackCostValueAccumulator] = useState(0);
  const [selectedIndustry, setSelectedIndustry] = useState('Financial Services');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-black';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-red-600';
      case 'Investigating': return 'text-yellow-600';
      case 'Resolved': return 'text-green-600';
      case 'False Positive': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const generateAlert = async () => {
    try {
      const response = await fetch(`/api/alerts/realtime?action=generate&industry=${selectedIndustry}`);
      const data = await response.json();
      
      if (data.success) {
        const newAlert = data.alert;
        
        // Calculate real-time attack costs for this alert
        const attackCostResponse = await fetch(`/api/analytics/attack-costs?ruleId=${newAlert.ruleId}&industry=${selectedIndustry}`);
        const attackCostData = await attackCostResponse.json();
        
        if (attackCostData.success) {
          // Enhance alert with real-time attack cost data
          const enhancedAlert = {
            ...newAlert,
            value: {
              ...newAlert.value,
              realTimeValue: attackCostData.totalCost || newAlert.value.immediateValue,
              threatBasedValue: attackCostData.totalIndustrySpecificThreats || newAlert.value.potentialLoss,
              attackCostValue: attackCostData.totalCost || newAlert.value.immediateValue
            },
            realTimeMetrics: {
              currentThreatLevel: attackCostData.totalIndustrySpecificThreats || 0,
              attackProbability: Math.random() * 100,
              timeToImpact: Math.floor(Math.random() * 24) + 1, // 1-24 hours
              financialExposure: attackCostData.totalCost || newAlert.value.immediateValue,
              industryRiskMultiplier: attackCostData.industryRiskMultiplier || 1.0
            }
          };
          
          setCurrentAlert(enhancedAlert);
          setAlertHistory(prev => [enhancedAlert, ...prev.slice(0, 9)]); // Keep last 10 alerts
          
          // Update accumulators with real-time values
          setValueAccumulator(prev => prev + enhancedAlert.value.immediateValue);
          setSavingsAccumulator(prev => prev + enhancedAlert.value.costSavings);
          setRealTimeValueAccumulator(prev => prev + enhancedAlert.value.realTimeValue);
          setThreatBasedValueAccumulator(prev => prev + enhancedAlert.value.threatBasedValue);
          setAttackCostValueAccumulator(prev => prev + enhancedAlert.value.attackCostValue);
          setAlertCount(prev => prev + 1);
          
          // Auto-clear current alert after 10 seconds
          setTimeout(() => {
            setCurrentAlert(null);
          }, 10000);
        }
      }
    } catch (error) {
      console.error('Error generating alert:', error);
    }
  };

  const startStreaming = () => {
    setIsStreaming(true);
    const interval = setInterval(() => {
      generateAlert();
    }, 8000); // Generate alert every 8 seconds
    setStreamingInterval(interval);
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    if (streamingInterval) {
      clearInterval(streamingInterval);
      setStreamingInterval(null);
    }
  };

  const resetDemo = () => {
    stopStreaming();
    setCurrentAlert(null);
    setAlertHistory([]);
    setValueAccumulator(0);
    setSavingsAccumulator(0);
    setRealTimeValueAccumulator(0);
    setThreatBasedValueAccumulator(0);
    setAttackCostValueAccumulator(0);
    setAlertCount(0);
    setDashboardData(null);
  };

  const loadDashboard = async () => {
    try {
      const response = await fetch(`/api/alerts/realtime?action=dashboard&industry=${selectedIndustry}`);
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.dashboard);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [selectedIndustry]);

  // Real-time value display component
  const RealTimeValueDisplay = ({ alert }: { alert: FinancialAlert }) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">Real-Time Value</p>
                <p className="text-lg font-bold text-green-700">
                  {formatCurrency(alert.value.realTimeValue)}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">Threat-Based Value</p>
                <p className="text-lg font-bold text-blue-700">
                  {formatCurrency(alert.value.threatBasedValue)}
                </p>
              </div>
              <TargetIcon className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 font-medium">Attack Cost Value</p>
              <p className="text-lg font-bold text-purple-700">
                {formatCurrency(alert.value.attackCostValue)}
              </p>
            </div>
            <ZapIcon className="h-5 w-5 text-purple-600" />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <p className="text-xs text-orange-600 font-medium">Threat Level</p>
          <p className="text-sm font-bold text-orange-700">
            {alert.realTimeMetrics.currentThreatLevel.toFixed(0)}%
          </p>
        </div>
        
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <p className="text-xs text-red-600 font-medium">Time to Impact</p>
          <p className="text-sm font-bold text-red-700">
            {alert.realTimeMetrics.timeToImpact}h
          </p>
        </div>
      </div>
    </div>
  );

  // Enhanced alert card with real-time values
  const AlertCard = ({ alert }: { alert: FinancialAlert }) => (
    <Card className="border-l-4 border-l-red-500 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-lg">{alert.ruleName}</CardTitle>
            <Badge className={getSeverityColor(alert.severity)}>
              {alert.severity}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </p>
            <p className={`text-sm font-medium ${getStatusColor(alert.status)}`}>
              {alert.status}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{alert.description}</p>
        
        {/* Real-time value display */}
        <RealTimeValueDisplay alert={alert} />
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 font-medium">Threat Actor</p>
            <p className="text-sm font-semibold">{alert.threatIntelligence.threatActor}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Technique</p>
            <p className="text-sm font-semibold">{alert.threatIntelligence.technique}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 font-medium mb-2">Recent Real Attacks</p>
          <div className="space-y-1">
            {alert.threatIntelligence.realThreatData.recentAttacks.slice(0, 2).map((attack, idx) => (
              <p key={idx} className="text-xs text-gray-600">• {attack}</p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Microsoft Sentinel Alerts</h2>
          <p className="text-gray-600">Real-time financial impact based on actual threats and attacks in the wild</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select 
            value={selectedIndustry} 
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="Financial Services">Financial Services</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Technology">Technology</option>
            <option value="Energy">Energy</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Retail">Retail</option>
            <option value="Education">Education</option>
            <option value="Government">Government</option>
            <option value="Hospitality">Hospitality</option>
            <option value="Professional Services">Professional Services</option>
          </select>
          
          <Button
            onClick={isStreaming ? stopStreaming : startStreaming}
            variant={isStreaming ? "destructive" : "default"}
            className="flex items-center space-x-2"
          >
            {isStreaming ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isStreaming ? 'Stop' : 'Start'} Streaming</span>
          </Button>
          
          <Button
            onClick={resetDemo}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* Real-time Value Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Real-Time Value</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(realTimeValueAccumulator)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Threat-Based Value</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(threatBasedValueAccumulator)}
                </p>
              </div>
              <TargetIcon className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Attack Cost Value</p>
                <p className="text-2xl font-bold text-purple-700">
                  {formatCurrency(attackCostValueAccumulator)}
                </p>
              </div>
              <ZapIcon className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Total Alerts</p>
                <p className="text-2xl font-bold text-orange-700">{alertCount}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Alert */}
      {currentAlert && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Alert</h3>
          <AlertCard alert={currentAlert} />
        </div>
      )}

      {/* Alert History */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Alert History</h3>
        <div className="space-y-3">
          {alertHistory.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </div>
    </div>
  );
} 