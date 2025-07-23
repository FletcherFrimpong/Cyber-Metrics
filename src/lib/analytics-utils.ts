import { RulePerformance } from './analytics-engine';

export function calculatePerformanceScore(performance: RulePerformance): number {
  const { accuracy, precision, recall, f1Score } = performance;
  
  // Weighted average of key performance metrics
  const weightedScore = (accuracy * 0.3) + (precision * 0.25) + (recall * 0.25) + (f1Score * 0.2);
  
  return Math.round(weightedScore * 100) / 100;
}

export function calculateFalsePositiveRate(performance: RulePerformance): number {
  const { totalTriggers, falsePositives } = performance;
  
  if (totalTriggers === 0) return 0;
  
  return Math.round((falsePositives / totalTriggers) * 100 * 100) / 100;
}

export function calculateRiskScore(performance: RulePerformance): number {
  const falsePositiveRate = calculateFalsePositiveRate(performance);
  const responseTime = performance.avgResponseTime;
  
  // Risk score based on false positive rate and response time
  // Lower is better
  const riskScore = (falsePositiveRate * 0.6) + (responseTime * 0.4);
  
  return Math.round(riskScore * 100) / 100;
}

export function calculateOptimizationPriority(performance: RulePerformance): 'low' | 'medium' | 'high' | 'critical' {
  const riskScore = calculateRiskScore(performance);
  const falsePositiveRate = calculateFalsePositiveRate(performance);
  
  if (riskScore > 15 || falsePositiveRate > 10) return 'critical';
  if (riskScore > 10 || falsePositiveRate > 5) return 'high';
  if (riskScore > 5 || falsePositiveRate > 2) return 'medium';
  return 'low';
}

export function calculateCostSavings(performance: RulePerformance, avgIncidentCost: number = 75000): number {
  const { truePositives } = performance;
  
  // Calculate cost savings based on prevented incidents
  return truePositives * avgIncidentCost;
}

export function calculateROI(performance: RulePerformance, operationalCost: number = 50000): number {
  const costSavings = performance.costSavings;
  
  if (operationalCost === 0) return 0;
  
  return Math.round(((costSavings - operationalCost) / operationalCost) * 100 * 100) / 100;
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  } else if (seconds < 3600) {
    return `${(seconds / 60).toFixed(1)}m`;
  } else {
    return `${(seconds / 3600).toFixed(1)}h`;
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'text-red-500';
    case 'high':
      return 'text-orange-500';
    case 'medium':
      return 'text-yellow-500';
    case 'low':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'resolved':
      return 'text-green-500';
    case 'investigating':
      return 'text-yellow-500';
    case 'open':
      return 'text-red-500';
    case 'false_positive':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
} 