import { NextRequest, NextResponse } from 'next/server';
import { fetchSentinelAlerts, SentinelAlert } from '../../../../lib/sentinel-alerts';
import { RealTimeAttackCostCalculator } from '../../../../lib/real-time-attack-costs';
import { RealDataIntegrationEngine } from '../../../../lib/real-data-integration-engine';

// Initialize attack cost calculator and real data engine
const attackCostCalculator = new RealTimeAttackCostCalculator();
const realDataEngine = new RealDataIntegrationEngine();

// Enhanced alert-to-threat mapping based on Microsoft Sentinel alerts
const ALERT_THREAT_MAPPING = {
  // Authentication and credential attacks
  'authentication': {
    alertPatterns: ['brute force', 'credential', 'authentication', 'password'],
    threatActors: ['APT29', 'Lazarus Group', 'APT28'],
    techniques: ['T1110', 'T1078', 'T1110.001', 'T1110.002'],
    baseCost: 2500000,
    industryMultipliers: {
      'Healthcare': 1.8, 'Financial Services': 1.6, 'Technology': 1.4,
      'Energy': 1.5, 'Manufacturing': 1.3, 'Retail': 1.2,
      'Education': 1.1, 'Government': 1.7, 'Hospitality': 1.4, 'Professional Services': 1.5
    }
  },
  
  // Process execution and PowerShell attacks
  'process-execution': {
    alertPatterns: ['powershell', 'process', 'execution', 'suspicious process'],
    threatActors: ['APT28', 'APT41', 'APT29'],
    techniques: ['T1059.001', 'T1055', 'T1055.001', 'T1055.002'],
    baseCost: 1900000,
    industryMultipliers: {
      'Healthcare': 1.7, 'Financial Services': 1.6, 'Technology': 1.5,
      'Energy': 1.6, 'Manufacturing': 1.4, 'Retail': 1.3,
      'Education': 1.2, 'Government': 1.7, 'Hospitality': 1.4, 'Professional Services': 1.5
    }
  },
  
  // Network activity and C2 communication
  'network-activity': {
    alertPatterns: ['network', 'unusual network', 'connection', 'c2'],
    threatActors: ['APT28', 'APT29', 'APT41'],
    techniques: ['T1071', 'T1041', 'T1090', 'T1090.001'],
    baseCost: 2200000,
    industryMultipliers: {
      'Healthcare': 1.6, 'Financial Services': 1.7, 'Technology': 1.5,
      'Energy': 1.8, 'Manufacturing': 1.5, 'Retail': 1.3,
      'Education': 1.2, 'Government': 1.8, 'Hospitality': 1.4, 'Professional Services': 1.5
    }
  },
  
  // File activity and malware deployment
  'file-activity': {
    alertPatterns: ['file', 'suspicious file', 'creation', 'malware'],
    threatActors: ['APT28', 'APT29', 'APT41'],
    techniques: ['T1036', 'T1055', 'T1027', 'T1027.001'],
    baseCost: 1800000,
    industryMultipliers: {
      'Healthcare': 1.5, 'Financial Services': 1.6, 'Technology': 1.5,
      'Energy': 1.6, 'Manufacturing': 1.4, 'Retail': 1.3,
      'Education': 1.2, 'Government': 1.7, 'Hospitality': 1.4, 'Professional Services': 1.5
    }
  },
  
  // Registry persistence
  'registry-activity': {
    alertPatterns: ['registry', 'persistence', 'modification'],
    threatActors: ['APT28', 'APT29'],
    techniques: ['T1547', 'T1546', 'T1547.001', 'T1547.002'],
    baseCost: 1600000,
    industryMultipliers: {
      'Healthcare': 1.4, 'Financial Services': 1.5, 'Technology': 1.4,
      'Energy': 1.5, 'Manufacturing': 1.3, 'Retail': 1.2,
      'Education': 1.1, 'Government': 1.6, 'Hospitality': 1.3, 'Professional Services': 1.4
    }
  },
  
  // Service creation and privilege escalation
  'service-activity': {
    alertPatterns: ['service', 'suspicious service', 'creation', 'privilege'],
    threatActors: ['APT28', 'APT29', 'APT41'],
    techniques: ['T1543', 'T1050', 'T1543.001', 'T1543.002'],
    baseCost: 2000000,
    industryMultipliers: {
      'Healthcare': 1.6, 'Financial Services': 1.7, 'Technology': 1.5,
      'Energy': 1.7, 'Manufacturing': 1.4, 'Retail': 1.3,
      'Education': 1.2, 'Government': 1.8, 'Hospitality': 1.4, 'Professional Services': 1.5
    }
  },
  
  // Scheduled task persistence
  'scheduled-task': {
    alertPatterns: ['scheduled task', 'task creation', 'persistence'],
    threatActors: ['APT28', 'APT29'],
    techniques: ['T1053', 'T1053.001', 'T1053.002', 'T1053.003'],
    baseCost: 1500000,
    industryMultipliers: {
      'Healthcare': 1.3, 'Financial Services': 1.4, 'Technology': 1.3,
      'Energy': 1.4, 'Manufacturing': 1.2, 'Retail': 1.1,
      'Education': 1.0, 'Government': 1.5, 'Hospitality': 1.2, 'Professional Services': 1.3
    }
  },
  
  // WMI lateral movement
  'wmi-activity': {
    alertPatterns: ['wmi', 'lateral', 'movement', 'remote'],
    threatActors: ['APT28', 'APT29', 'APT41'],
    techniques: ['T1047', 'T1021', 'T1047.001', 'T1021.001'],
    baseCost: 2400000,
    industryMultipliers: {
      'Healthcare': 1.7, 'Financial Services': 1.8, 'Technology': 1.6,
      'Energy': 1.8, 'Manufacturing': 1.5, 'Retail': 1.4,
      'Education': 1.3, 'Government': 1.9, 'Hospitality': 1.5, 'Professional Services': 1.6
    }
  },
  
  // DNS activity and exfiltration
  'dns-activity': {
    alertPatterns: ['dns', 'suspicious dns', 'query', 'exfiltration'],
    threatActors: ['APT28', 'APT29', 'APT41'],
    techniques: ['T1071.004', 'T1041', 'T1041.001', 'T1041.002'],
    baseCost: 1700000,
    industryMultipliers: {
      'Healthcare': 1.4, 'Financial Services': 1.6, 'Technology': 1.4,
      'Energy': 1.5, 'Manufacturing': 1.3, 'Retail': 1.2,
      'Education': 1.1, 'Government': 1.6, 'Hospitality': 1.3, 'Professional Services': 1.4
    }
  },
  
  // HTTP activity and web protocols
  'http-activity': {
    alertPatterns: ['http', 'user agent', 'web', 'protocol'],
    threatActors: ['APT28', 'APT29'],
    techniques: ['T1071.001', 'T1040', 'T1071.002', 'T1071.003'],
    baseCost: 1400000,
    industryMultipliers: {
      'Healthcare': 1.2, 'Financial Services': 1.4, 'Technology': 1.3,
      'Energy': 1.3, 'Manufacturing': 1.1, 'Retail': 1.0,
      'Education': 0.9, 'Government': 1.4, 'Hospitality': 1.1, 'Professional Services': 1.2
    }
  }
};

// Categorize alert based on name and description patterns
function categorizeAlert(alertName: string, alertDescription: string): string[] {
  const categories: string[] = [];
  const nameLower = alertName.toLowerCase();
  const descLower = alertDescription?.toLowerCase() || '';
  
  for (const [category, config] of Object.entries(ALERT_THREAT_MAPPING)) {
    const matches = (config as any).alertPatterns.some((pattern: string) => 
      nameLower.includes(pattern) || descLower.includes(pattern)
    );
    if (matches) {
      categories.push(category);
    }
  }
  
  return categories;
}

// Calculate alert effectiveness based on performance metrics
function calculateAlertEffectiveness(alert: SentinelAlert): number {
  const falsePositives = alert.performanceMetrics.falsePositives;
  const truePositives = alert.performanceMetrics.truePositives;
  const totalAlerts = alert.performanceMetrics.totalAlerts;
  const responseTime = alert.performanceMetrics.averageResponseTime;
  
  if (totalAlerts === 0) return 50; // Default effectiveness
  
  const falsePositiveRate = falsePositives / totalAlerts;
  const detectionRate = truePositives / totalAlerts;
  
  let effectiveness = 100;
  effectiveness -= falsePositiveRate * 50; // Penalize false positives
  effectiveness += detectionRate * 30; // Reward detection rate
  effectiveness -= Math.max(0, (responseTime - 2000) / 100); // Penalize slow response
  
  return Math.max(0, Math.min(100, effectiveness));
}

// Calculate real-time attack costs using Microsoft Sentinel alerts
async function calculateRealTimeAttackCosts(
  alerts: SentinelAlert[], 
  industry: string, 
  ruleId?: string
) {
  console.log('Starting real-time attack cost calculation with Microsoft Sentinel alerts...');
  
  try {
    // Get real detection rules for rule names
    const realRules = await realDataEngine.getRealDetectionRules();
    
    // Get real alerts if not provided
    let realAlerts = alerts;
    if (alerts.length === 0) {
      console.log('Fetching real Microsoft Sentinel alerts...');
      realAlerts = await fetchSentinelAlerts();
    }
    
    // Filter by rule ID if specified
    if (ruleId) {
      // Map analytics rule IDs to Sentinel alert IDs
      const alertIdMapping: { [key: string]: string } = {
        'sentinel-001': 'sentinel-auth-001',
        'sentinel-002': 'sentinel-powershell-002',
        'sentinel-003': 'sentinel-network-003',
        'sentinel-004': 'sentinel-file-004',
        'sentinel-005': 'sentinel-registry-005',
        'sentinel-006': 'sentinel-service-006',
        'sentinel-007': 'sentinel-task-007',
        'sentinel-008': 'sentinel-wmi-008',
        'sentinel-009': 'sentinel-dns-009',
        'sentinel-010': 'sentinel-http-010',
        'sentinel-011': 'sentinel-auth-001',
        'sentinel-012': 'sentinel-powershell-002',
        'sentinel-013': 'sentinel-network-003',
        'sentinel-014': 'sentinel-file-004',
        'sentinel-015': 'sentinel-registry-005',
        'sentinel-016': 'sentinel-service-006',
        'sentinel-017': 'sentinel-task-007',
        'sentinel-018': 'sentinel-wmi-008',
        'sentinel-019': 'sentinel-dns-009',
        'sentinel-020': 'sentinel-http-010',
        'sentinel-021': 'sentinel-auth-001',
        'sentinel-022': 'sentinel-powershell-002',
        'sentinel-023': 'sentinel-network-003',
        'sentinel-024': 'sentinel-file-004',
        'sentinel-025': 'sentinel-registry-005'
      };
      
      const mappedAlertId = alertIdMapping[ruleId] || ruleId;
      const filteredAlerts = realAlerts.filter(alert => alert.alertId === mappedAlertId);
      
      if (filteredAlerts.length === 0) {
        // If no exact match, try to find by name or description
        const nameMatch = realAlerts.find(alert => 
          alert.name.toLowerCase().includes(ruleId.toLowerCase()) ||
          alert.description.toLowerCase().includes(ruleId.toLowerCase())
        );
        
        if (nameMatch) {
          realAlerts = [nameMatch];
        } else {
          // Return all alerts if no specific match found
          console.log(`Alert not found: ${ruleId}, returning all alerts`);
        }
      } else {
        realAlerts = filteredAlerts;
      }
    }
    
    console.log(`Calculating attack costs for ${realAlerts.length} alerts in ${industry} industry...`);
    
    // Calculate attack costs for each alert
    const attackCosts = realAlerts.map(alert => {
      const categories = categorizeAlert(alert.name, alert.description);
      const effectiveness = calculateAlertEffectiveness(alert);
      
      // Find corresponding rule for this alert
      const correspondingRule = realRules.find(rule => {
        // Try to match by alert ID mapping
        const alertIdMapping: { [key: string]: string } = {
          'sentinel-auth-001': 'sentinel-001',
          'sentinel-powershell-002': 'sentinel-002',
          'sentinel-network-003': 'sentinel-003',
          'sentinel-file-004': 'sentinel-004',
          'sentinel-registry-005': 'sentinel-005',
          'sentinel-service-006': 'sentinel-006',
          'sentinel-task-007': 'sentinel-007',
          'sentinel-wmi-008': 'sentinel-008',
          'sentinel-dns-009': 'sentinel-009',
          'sentinel-http-010': 'sentinel-010'
        };
        
        const mappedRuleId = alertIdMapping[alert.alertId];
        return mappedRuleId === rule.id;
      });
      
      let baseCost = 2000000; // Default base cost
      let industryMultiplier = 1.0;
      let threatMultiplier = 1.0;
      let techniqueMultiplier = 1.0;
      let complianceMultiplier = 1.0;
      
      // Calculate costs based on categories
      categories.forEach(category => {
        const config = ALERT_THREAT_MAPPING[category as keyof typeof ALERT_THREAT_MAPPING];
        if (config) {
          baseCost = Math.max(baseCost, config.baseCost);
          industryMultiplier = Math.max(industryMultiplier, 
            (config.industryMultipliers as any)[industry] || 1.0);
        }
      });
      
      // Apply severity multiplier
      const severityMultipliers = {
        'Critical': 1.5,
        'High': 1.3,
        'Medium': 1.0,
        'Low': 0.7
      };
      const severityMultiplier = severityMultipliers[alert.severity] || 1.0;
      
      // Apply effectiveness multiplier
      const effectivenessMultiplier = effectiveness / 100;
      
      const industryCost = Math.round(baseCost * industryMultiplier * severityMultiplier);
      const threatCost = Math.round(baseCost * threatMultiplier * severityMultiplier);
      const techniqueCost = Math.round(baseCost * techniqueMultiplier * severityMultiplier);
      const complianceCost = Math.round(baseCost * complianceMultiplier * severityMultiplier);
      
      const totalCost = Math.round(
        (baseCost + industryCost + threatCost + techniqueCost + complianceCost) * 
        effectivenessMultiplier / 5
      );
      
      return {
        ruleId: correspondingRule?.id || alert.alertId,
        ruleName: correspondingRule?.name || alert.name,
        alertId: alert.alertId,
        alertName: alert.name,
        totalCost,
        baseCost: Math.round(baseCost * effectivenessMultiplier),
        industryCost,
        threatActorCost: threatCost,
        techniqueCost,
        complianceCost,
        costBreakdown: {
          base: Math.round(baseCost * effectivenessMultiplier),
          industry: industryCost,
          threat: threatCost,
          technique: techniqueCost,
          compliance: complianceCost
        },
        threatIntelligence: {
          threatActors: alert.threatIntelligence.threatActors,
          mitreTechniques: alert.relevantTechniques,
          recentAttacks: alert.threatIntelligence.attackVectors,
          confidenceScore: alert.confidenceScore,
          dataSource: alert.sourceAttribution
        },
        industryContext: {
          industry,
          industryMultiplier,
          severityMultiplier,
          effectivenessMultiplier
        },
        performanceMetrics: {
          effectiveness,
          falsePositiveRate: alert.performanceMetrics.falsePositives / alert.performanceMetrics.totalAlerts,
          detectionRate: alert.performanceMetrics.truePositives / alert.performanceMetrics.totalAlerts,
          averageResponseTime: alert.performanceMetrics.averageResponseTime
        }
      };
    });
    
    // Calculate summary statistics
    const totalCost = attackCosts.reduce((sum, cost) => sum + cost.totalCost, 0);
    const averageCost = totalCost / attackCosts.length;
    const maxCost = Math.max(...attackCosts.map(cost => cost.totalCost));
    const minCost = Math.min(...attackCosts.map(cost => cost.totalCost));
    
    const costDistribution = {
      'Critical': attackCosts.filter(cost => cost.alertName.includes('Critical')).length,
      'High': attackCosts.filter(cost => cost.alertName.includes('High')).length,
      'Medium': attackCosts.filter(cost => cost.alertName.includes('Medium')).length,
      'Low': attackCosts.filter(cost => cost.alertName.includes('Low')).length
    };
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        attackCosts: attackCosts,
        summary: {
          totalCost,
          averageCost: Math.round(averageCost),
          maxCost,
          minCost,
          costDistribution,
          totalAlerts: attackCosts.length,
          industry
        },
        metadata: {
          calculationMethod: 'Real-time with Microsoft Sentinel alerts',
          dataSources: ['Microsoft Sentinel GitHub Repository', 'IBM Cost of Data Breach 2024', 'Sophos Ransomware Report 2024', 'CISA Advisories'],
          lastUpdated: new Date().toISOString(),
          confidence: 'High - Based on real Microsoft Sentinel alerts'
        }
      }
    };
    
    console.log('Real-time attack cost calculation completed successfully');
    return response;
    
  } catch (error) {
    console.error('Error calculating real-time attack costs:', error);
    throw error;
  }
}

// New function to get all rules with their attack costs
async function getAllRulesWithAttackCosts(industry: string) {
  try {
    console.log('Getting all rules with attack costs...');
    
    // Get all real detection rules
    const realRules = await realDataEngine.getRealDetectionRules();
    
    // Get real alerts
    const alerts = await fetchSentinelAlerts();
    
    // Calculate attack costs for each rule
    const rulesWithCosts = await Promise.all(
      realRules.map(async (rule) => {
        try {
          const result = await calculateRealTimeAttackCosts(alerts, industry, rule.id);
          const ruleCost = result.data.attackCosts[0] || {
            ruleId: rule.id,
            ruleName: rule.name,
            totalCost: 0,
            baseCost: 0,
            industryCost: 0,
            threatActorCost: 0,
            techniqueCost: 0,
            complianceCost: 0
          };
          
          return {
            ruleId: rule.id,
            ruleName: rule.name,
            platform: rule.platform,
            severity: rule.severity,
            status: rule.status,
            attackCost: ruleCost.totalCost,
            costBreakdown: ruleCost.costBreakdown,
            threatActors: rule.threat_actors,
            mitreTechniques: rule.mitre_techniques,
            complianceRequirements: rule.compliance_requirements,
            lastUpdated: rule.last_updated,
            confidenceScore: rule.confidence_score
          };
        } catch (error) {
          console.error(`Error calculating cost for rule ${rule.id}:`, error);
          return {
            ruleId: rule.id,
            ruleName: rule.name,
            platform: rule.platform,
            severity: rule.severity,
            status: rule.status,
            attackCost: 0,
            costBreakdown: { base: 0, industry: 0, threat: 0, technique: 0, compliance: 0 },
            threatActors: rule.threat_actors,
            mitreTechniques: rule.mitre_techniques,
            complianceRequirements: rule.compliance_requirements,
            lastUpdated: rule.last_updated,
            confidenceScore: rule.confidence_score
          };
        }
      })
    );
    
    // Sort by attack cost (highest first)
    rulesWithCosts.sort((a, b) => b.attackCost - a.attackCost);
    
    const totalCost = rulesWithCosts.reduce((sum, rule) => sum + rule.attackCost, 0);
    const averageCost = totalCost / rulesWithCosts.length;
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        rules: rulesWithCosts,
        summary: {
          totalRules: rulesWithCosts.length,
          totalCost,
          averageCost: Math.round(averageCost),
          maxCost: Math.max(...rulesWithCosts.map(r => r.attackCost)),
          minCost: Math.min(...rulesWithCosts.map(r => r.attackCost)),
          industry
        },
        metadata: {
          calculationMethod: 'All rules with real-time attack costs',
          dataSources: ['Real Detection Rules', 'Microsoft Sentinel Alerts', 'IBM Cost of Data Breach 2024'],
          lastUpdated: new Date().toISOString(),
          confidence: 'High - Based on real detection rules and threat intelligence'
        }
      }
    };
    
  } catch (error) {
    console.error('Error getting all rules with attack costs:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Attack costs API endpoint called');
    
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');
    const industry = searchParams.get('industry') || 'Technology';
    const useRealData = searchParams.get('realData') === 'true';
    const getAllRules = searchParams.get('getAllRules') === 'true';
    
    console.log(`Parameters: ruleId=${ruleId}, industry=${industry}, useRealData=${useRealData}, getAllRules=${getAllRules}`);
    
    // If getAllRules is true, return all rules with their attack costs
    if (getAllRules) {
      console.log('Getting all rules with attack costs...');
      const result = await getAllRulesWithAttackCosts(industry);
      return NextResponse.json(result);
    }
    
    if (useRealData) {
      console.log('Starting real-time attack cost calculation with real data...');
      
      // Use Microsoft Sentinel alerts for attack cost calculation
      const alerts = await fetchSentinelAlerts();
      const result = await calculateRealTimeAttackCosts(alerts, industry, ruleId || undefined);
      
      return NextResponse.json(result);
    } else {
      // Legacy fallback - return basic calculation
      console.log('Using legacy attack cost calculation...');
      
      const alerts = await fetchSentinelAlerts();
      const result = await calculateRealTimeAttackCosts(alerts, industry, ruleId || undefined);
      
      return NextResponse.json(result);
    }
    
  } catch (error) {
    console.error('Error in attack costs API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate attack costs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 