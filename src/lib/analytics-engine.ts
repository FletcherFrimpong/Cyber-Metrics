export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  enabled: boolean;
  performance: RulePerformance;
  lastUpdated: string;
}

export interface DetectionIncident {
  id: string;
  ruleId: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  description: string;
  source: string;
  impact: number;
}

export interface RulePerformance {
  totalTriggers: number;
  truePositives: number;
  falsePositives: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  avgResponseTime: number;
  costSavings: number;
}

export class AnalyticsEngine {
  private rules: DetectionRule[] = [];
  private incidents: DetectionIncident[] = [];

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample detection rules
    this.rules = [
      {
        id: 'rule-001',
        name: 'Suspicious Login Attempt',
        description: 'Detects multiple failed login attempts from same IP',
        severity: 'high',
        category: 'Authentication',
        enabled: true,
        performance: {
          totalTriggers: 1247,
          truePositives: 1189,
          falsePositives: 58,
          accuracy: 95.3,
          precision: 95.3,
          recall: 94.2,
          f1Score: 94.7,
          avgResponseTime: 2.3,
          costSavings: 4200000
        },
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'rule-002',
        name: 'Data Exfiltration Attempt',
        description: 'Detects unusual data transfer patterns',
        severity: 'critical',
        category: 'Data Protection',
        enabled: true,
        performance: {
          totalTriggers: 456,
          truePositives: 445,
          falsePositives: 11,
          accuracy: 97.6,
          precision: 97.6,
          recall: 96.8,
          f1Score: 97.2,
          avgResponseTime: 1.8,
          costSavings: 3800000
        },
        lastUpdated: new Date().toISOString()
      }
    ];

    // Sample incidents
    this.incidents = [
      {
        id: 'incident-001',
        ruleId: 'rule-001',
        timestamp: new Date().toISOString(),
        severity: 'high',
        status: 'investigating',
        description: 'Multiple failed login attempts detected from IP 192.168.1.100',
        source: 'Authentication System',
        impact: 75000
      }
    ];
  }

  public getRules(): DetectionRule[] {
    return this.rules;
  }

  public getIncidents(): DetectionIncident[] {
    return this.incidents;
  }

  public getRuleById(id: string): DetectionRule | undefined {
    return this.rules.find(rule => rule.id === id);
  }

  public getIncidentsByRuleId(ruleId: string): DetectionIncident[] {
    return this.incidents.filter(incident => incident.ruleId === ruleId);
  }

  public calculateOverallPerformance() {
    const totalRules = this.rules.length;
    const enabledRules = this.rules.filter(rule => rule.enabled).length;
    const avgAccuracy = this.rules.reduce((sum, rule) => sum + rule.performance.accuracy, 0) / totalRules;
    const totalCostSavings = this.rules.reduce((sum, rule) => sum + rule.performance.costSavings, 0);
    const openIncidents = this.incidents.filter(incident => incident.status !== 'resolved').length;

    return {
      totalRules,
      enabledRules,
      avgAccuracy,
      totalCostSavings,
      openIncidents,
      securityScore: Math.round(avgAccuracy)
    };
  }

  public getPerformanceMetrics() {
    const performance = this.calculateOverallPerformance();
    
    return {
      overview: {
        totalRules: performance.totalRules,
        activeRules: performance.enabledRules,
        securityScore: performance.securityScore,
        totalCostSavings: performance.totalCostSavings,
        openIncidents: performance.openIncidents
      },
      trends: {
        weeklyAccuracy: [92.1, 93.4, 94.2, 95.1, 94.8, 95.3, 94.2],
        weeklyIncidents: [45, 38, 42, 35, 41, 39, 23],
        weeklySavings: [3200000, 3400000, 3800000, 3600000, 3900000, 4100000, 4200000]
      }
    };
  }
} 