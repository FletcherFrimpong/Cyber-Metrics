import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface TopROIRule {
  id: string;
  name: string;
  platform: string;
  severity: string;
  performanceScore: number;
  falsePositiveRate: number;
  truePositiveRate: number;
  totalAlerts: number;
  falsePositives: number;
  truePositives: number;
  costPerAlert: number;
  riskScore: number;
  estimatedCostSavings: number;
  roiPercentage: number;
  industryImpact: {
    industry: string;
    averageBreachCost: number;
    industryMultiplier: number;
    adjustedSavings: number;
  };
  mitreMapping: {
    tactics: string[];
    techniques: string[];
  };
  optimizationRecommendations: string[];
  lastTriggered: string;
  averageResponseTime: number;
}

interface ExecutiveReport {
  reportId: string;
  generatedAt: string;
  summary: {
    totalRulesAnalyzed: number;
    topROIRules: number;
    totalEstimatedSavings: number;
    averageROI: number;
    industryContext: string;
    reportPeriod: string;
  };
  topROIRules: TopROIRule[];
  costAnalysis: {
    totalCostSavings: number;
    averageCostPerRule: number;
    highestSavingRule: string;
    roiByPlatform: {
      'Microsoft Sentinel': number;
      'Splunk': number;
      'CrowdStrike': number;
    };
    roiBySeverity: {
      'Critical': number;
      'High': number;
      'Medium': number;
      'Low': number;
    };
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  industryBenchmarks: {
    industry: string;
    averageBreachCost: number;
    industryRanking: number;
    topThreats: string[];
  };
}

// Industry-specific threat costs and multipliers
const INDUSTRY_DATA = {
  'Healthcare': {
    averageBreachCost: 11000000,
    multiplier: 2.47,
    topThreats: ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider', 'DragonForce'],
    industryRanking: 1
  },
  'Financial Services': {
    averageBreachCost: 5900000,
    multiplier: 1.33,
    topThreats: ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider', 'DragonForce'],
    industryRanking: 2
  },
  'Technology': {
    averageBreachCost: 5200000,
    multiplier: 1.17,
    topThreats: ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider', 'DragonForce'],
    industryRanking: 3
  },
  'Energy': {
    averageBreachCost: 4800000,
    multiplier: 1.08,
    topThreats: ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider', 'DragonForce'],
    industryRanking: 4
  },
  'Manufacturing': {
    averageBreachCost: 4200000,
    multiplier: 0.94,
    topThreats: ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider', 'DragonForce'],
    industryRanking: 5
  },
  'Retail': {
    averageBreachCost: 3200000,
    multiplier: 0.72,
    topThreats: ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider', 'DragonForce'],
    industryRanking: 6
  },
  'Education': {
    averageBreachCost: 3800000,
    multiplier: 0.85,
    topThreats: ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider', 'DragonForce'],
    industryRanking: 7
  },
  'Government': {
    averageBreachCost: 2500000,
    multiplier: 0.56,
    topThreats: ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider', 'DragonForce'],
    industryRanking: 8
  },
  'Hospitality': {
    averageBreachCost: 4000000,
    multiplier: 0.89,
    topThreats: ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider', 'DragonForce'],
    industryRanking: 9
  },
  'Professional Services': {
    averageBreachCost: 5000000,
    multiplier: 1.12,
    topThreats: ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider', 'DragonForce'],
    industryRanking: 10
  }
};

// Rule-to-threat mapping for cost calculations
const RULE_THREAT_MAPPING = {
  'healthcare-hipaa-breach-001': ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider'],
  'financial-payment-card-002': ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider'],
  'energy-scada-attack-003': ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider'],
  'manufacturing-espionage-004': ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider'],
  'retail-pos-breach-005': ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider'],
  'education-student-data-006': ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider'],
  'government-classified-007': ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider'],
  'hospitality-loyalty-008': ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider'],
  'professional-client-data-009': ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider'],
  'ransomware-encryption-010': ['ALPHV/BlackCat', 'LockBit', 'Scattered Spider']
};

// MITRE ATT&CK mapping for rules
const MITRE_MAPPING = {
  'healthcare-hipaa-breach-001': {
    tactics: ['Initial Access', 'Execution', 'Exfiltration'],
    techniques: ['T1078', 'T1059', 'T1041']
  },
  'financial-payment-card-002': {
    tactics: ['Initial Access', 'Collection', 'Exfiltration'],
    techniques: ['T1078', 'T1056', 'T1041']
  },
  'energy-scada-attack-003': {
    tactics: ['Initial Access', 'Execution', 'Impact'],
    techniques: ['T1078', 'T1059', 'T1499']
  },
  'manufacturing-espionage-004': {
    tactics: ['Initial Access', 'Discovery', 'Exfiltration'],
    techniques: ['T1078', 'T1083', 'T1041']
  },
  'retail-pos-breach-005': {
    tactics: ['Initial Access', 'Collection', 'Exfiltration'],
    techniques: ['T1078', 'T1056', 'T1041']
  },
  'education-student-data-006': {
    tactics: ['Initial Access', 'Collection', 'Exfiltration'],
    techniques: ['T1078', 'T1056', 'T1041']
  },
  'government-classified-007': {
    tactics: ['Initial Access', 'Discovery', 'Exfiltration'],
    techniques: ['T1078', 'T1083', 'T1041']
  },
  'hospitality-loyalty-008': {
    tactics: ['Initial Access', 'Collection', 'Exfiltration'],
    techniques: ['T1078', 'T1056', 'T1041']
  },
  'professional-client-data-009': {
    tactics: ['Initial Access', 'Collection', 'Exfiltration'],
    techniques: ['T1078', 'T1056', 'T1041']
  },
  'ransomware-encryption-010': {
    tactics: ['Initial Access', 'Execution', 'Impact'],
    techniques: ['T1078', 'T1059', 'T1486']
  }
};

function calculateROI(rule: any, industryData: any): number {
  const costSavings = rule.truePositives * industryData.averageBreachCost * industryData.multiplier;
  const operationalCosts = rule.totalAlerts * rule.costPerAlert;
  return operationalCosts > 0 ? ((costSavings - operationalCosts) / operationalCosts) * 100 : 0;
}

function generateOptimizationRecommendations(rule: any): string[] {
  const recommendations = [];
  
  if (rule.falsePositiveRate > 0.15) {
    recommendations.push('Optimize detection logic to reduce false positive rate');
  }
  
  if (rule.averageResponseTime > 30) {
    recommendations.push('Improve response time through query optimization');
  }
  
  if (rule.performanceScore < 70) {
    recommendations.push('Enhance rule performance through tuning and refinement');
  }
  
  if (rule.totalAlerts < 100) {
    recommendations.push('Consider expanding detection coverage for broader threat visibility');
  }
  
  return recommendations;
}

async function generateExecutiveReport(industry: string = 'Technology'): Promise<ExecutiveReport> {
  // Load sample rules data
  const rulesPath = path.join(process.cwd(), 'src', 'data', 'sentinel-rules.json');
  const rulesData = JSON.parse(await fs.readFile(rulesPath, 'utf-8'));
  
  const industryData = INDUSTRY_DATA[industry as keyof typeof INDUSTRY_DATA] || INDUSTRY_DATA['Technology'];
  
  // Calculate ROI and cost savings for each rule
  const rulesWithROI = rulesData.map((rule: any) => {
    const associatedThreats = RULE_THREAT_MAPPING[rule.id as keyof typeof RULE_THREAT_MAPPING] || [];
    const mitreData = MITRE_MAPPING[rule.id as keyof typeof MITRE_MAPPING] || { tactics: [], techniques: [] };
    
    // Calculate industry-specific cost savings
    let industrySpecificCost = industryData.averageBreachCost;
    if (associatedThreats.length > 0) {
      const totalThreatCost = associatedThreats.reduce((sum: number, threat: string) => {
        return sum + (industryData.averageBreachCost * 0.8); // Simplified calculation
      }, 0);
      industrySpecificCost = totalThreatCost / associatedThreats.length;
    }
    
    const estimatedCostSavings = rule.truePositives * industrySpecificCost * industryData.multiplier;
    const roiPercentage = calculateROI(rule, industryData);
    
    return {
      id: rule.id,
      name: rule.name,
      platform: rule.platform,
      severity: rule.severity,
      performanceScore: rule.performanceScore || 75,
      falsePositiveRate: rule.falsePositiveRate || 0.12,
      truePositiveRate: rule.truePositiveRate || 0.88,
      totalAlerts: rule.totalAlerts || 500,
      falsePositives: rule.falsePositives || 60,
      truePositives: rule.truePositives || 440,
      costPerAlert: rule.costPerAlert || 150,
      riskScore: rule.riskScore || 65,
      estimatedCostSavings,
      roiPercentage,
      industryImpact: {
        industry,
        averageBreachCost: industryData.averageBreachCost,
        industryMultiplier: industryData.multiplier,
        adjustedSavings: estimatedCostSavings
      },
      mitreMapping: mitreData,
      optimizationRecommendations: generateOptimizationRecommendations(rule),
      lastTriggered: rule.lastTriggered || new Date().toISOString(),
      averageResponseTime: rule.averageResponseTime || 25
    };
  });
  
  // Sort by ROI and get top 10
  const topROIRules = rulesWithROI
    .sort((a: TopROIRule, b: TopROIRule) => b.roiPercentage - a.roiPercentage)
    .slice(0, 10);
  
  const totalEstimatedSavings = topROIRules.reduce((sum: number, rule: TopROIRule) => sum + rule.estimatedCostSavings, 0);
  const averageROI = topROIRules.reduce((sum: number, rule: TopROIRule) => sum + rule.roiPercentage, 0) / topROIRules.length;
  
  // Calculate platform and severity distributions
  const roiByPlatform = {
    'Microsoft Sentinel': topROIRules.filter((r: TopROIRule) => r.platform === 'Microsoft Sentinel').reduce((sum: number, r: TopROIRule) => sum + r.roiPercentage, 0) / Math.max(1, topROIRules.filter((r: TopROIRule) => r.platform === 'Microsoft Sentinel').length),
    'Splunk': topROIRules.filter((r: TopROIRule) => r.platform === 'Splunk').reduce((sum: number, r: TopROIRule) => sum + r.roiPercentage, 0) / Math.max(1, topROIRules.filter((r: TopROIRule) => r.platform === 'Splunk').length),
    'CrowdStrike': topROIRules.filter((r: TopROIRule) => r.platform === 'CrowdStrike').reduce((sum: number, r: TopROIRule) => sum + r.roiPercentage, 0) / Math.max(1, topROIRules.filter((r: TopROIRule) => r.platform === 'CrowdStrike').length)
  };
  
  const roiBySeverity = {
    'Critical': topROIRules.filter((r: TopROIRule) => r.severity === 'Critical').reduce((sum: number, r: TopROIRule) => sum + r.roiPercentage, 0) / Math.max(1, topROIRules.filter((r: TopROIRule) => r.severity === 'Critical').length),
    'High': topROIRules.filter((r: TopROIRule) => r.severity === 'High').reduce((sum: number, r: TopROIRule) => sum + r.roiPercentage, 0) / Math.max(1, topROIRules.filter((r: TopROIRule) => r.severity === 'High').length),
    'Medium': topROIRules.filter((r: TopROIRule) => r.severity === 'Medium').reduce((sum: number, r: TopROIRule) => sum + r.roiPercentage, 0) / Math.max(1, topROIRules.filter((r: TopROIRule) => r.severity === 'Medium').length),
    'Low': topROIRules.filter((r: TopROIRule) => r.severity === 'Low').reduce((sum: number, r: TopROIRule) => sum + r.roiPercentage, 0) / Math.max(1, topROIRules.filter((r: TopROIRule) => r.severity === 'Low').length)
  };
  
  const report: ExecutiveReport = {
    reportId: `EXEC-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    summary: {
      totalRulesAnalyzed: rulesData.length,
      topROIRules: topROIRules.length,
      totalEstimatedSavings,
      averageROI,
      industryContext: industry,
      reportPeriod: 'Last 30 Days'
    },
    topROIRules,
    costAnalysis: {
      totalCostSavings: totalEstimatedSavings,
      averageCostPerRule: totalEstimatedSavings / topROIRules.length,
      highestSavingRule: topROIRules[0]?.name || 'N/A',
      roiByPlatform,
      roiBySeverity
    },
    recommendations: {
      immediate: [
        'Implement the top 3 ROI rules immediately for maximum cost savings',
        'Optimize false positive rates for rules with ROI > 200%',
        'Focus on Critical and High severity rules with high ROI'
      ],
      shortTerm: [
        'Expand detection coverage for identified threat gaps',
        'Implement automated response workflows for high-ROI rules',
        'Establish performance monitoring for ROI tracking'
      ],
      longTerm: [
        'Develop custom detection rules based on ROI analysis',
        'Implement machine learning enhancements for rule optimization',
        'Establish cross-platform rule correlation for improved detection'
      ]
    },
    industryBenchmarks: {
      industry,
      averageBreachCost: industryData.averageBreachCost,
      industryRanking: industryData.industryRanking,
      topThreats: industryData.topThreats
    }
  };
  
  return report;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry') || 'Technology';
    
    console.log('Generating executive report for industry:', industry);
    
    const report = await generateExecutiveReport(industry);
    
    return NextResponse.json({
      success: true,
      report,
      message: 'Executive report generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating executive report:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate executive report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 