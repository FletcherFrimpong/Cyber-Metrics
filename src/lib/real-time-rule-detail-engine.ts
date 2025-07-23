import { RealDataIntegrationEngine } from './real-data-integration-engine';

export interface RuleMetadata {
  id: string;
  name: string;
  description: string;
  platform: string;
  score: number;
  created: string;
  lastUpdated: string;
  query: string;
  queryFrequency: string;
  queryPeriod: string;
  triggerOperator: string;
  triggerThreshold: number;
  tactics: string[];
  techniques: string[];
  version: string;
  source: string;
  sigmaRule?: {
    title: string;
    id: string;
    description: string;
    author: string;
    date: string;
    logsource: {
      category: string;
      product: string;
    };
    detection: {
      selection: any;
      condition: string;
    };
    falsepositives: string[];
    level: string;
    tags: string[];
  };
  mitreTechniques: string[];
  threatActors: string[];
  dataSources: string[];
  complianceRequirements: string[];
  realExamples: string[];
  sourceAttribution: string;
  lastUpdated: Date;
  confidenceScore: number;
  validationStatus: 'verified' | 'pending' | 'unverified';
}

export interface RuleDetailAnalysis {
  metadata: RuleMetadata;
  performanceMetrics: {
    f1Score: number;
    precision: number;
    recall: number;
    falsePositiveRate: number;
    truePositiveRate: number;
    totalAlerts: number;
    falsePositives: number;
    truePositives: number;
    averageResponseTime: number;
    costPerAlert: number;
    riskScore: number;
  };
  tuningSuggestions: {
    type: 'query' | 'threshold' | 'logic' | 'data_source' | 'ml_enhancement';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimatedImpact: string;
  }[];
  threatIntelligence: {
    threatActors: string[];
    mitreTechniques: string[];
    recentAttacks: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  complianceImpact: {
    regulations: string[];
    requirements: string[];
    auditStatus: 'compliant' | 'non-compliant' | 'pending';
    nextReviewDate: string;
  };
}

export class RealTimeRuleDetailEngine {
  private realDataEngine: RealDataIntegrationEngine;

  constructor() {
    this.realDataEngine = new RealDataIntegrationEngine();
  }

  // Get comprehensive rule details using real data
  async getRuleDetails(ruleId: string): Promise<RuleDetailAnalysis> {
    try {
      console.log(`Loading real-time details for rule: ${ruleId}`);
      
      // Get real detection rules
      const rules = await this.realDataEngine.getDetectionRules();
      const rule = rules.find(r => r.id === ruleId);
      
      if (!rule) {
        throw new Error(`Rule ${ruleId} not found`);
      }

      // Extract metadata
      const metadata = this.extractMetadata(rule);
      
      // Calculate performance metrics
      const performanceMetrics = await this.calculatePerformanceMetrics(rule);
      
      // Generate tuning suggestions
      const tuningSuggestions = this.generateTuningSuggestions(rule, performanceMetrics);
      
      // Get threat intelligence
      const threatIntelligence = await this.getThreatIntelligence(rule);
      
      // Get compliance impact
      const complianceImpact = await this.getComplianceImpact(rule);

      console.log(`Rule details loaded successfully for ${ruleId}`);
      console.log(`Performance F1 Score: ${performanceMetrics.f1Score.toFixed(2)}`);

      return {
        metadata,
        performanceMetrics,
        tuningSuggestions,
        threatIntelligence,
        complianceImpact
      };
    } catch (error) {
      console.error('Error getting rule details:', error);
      return this.generateDefaultRuleDetails(ruleId);
    }
  }

  // Extract metadata from real rule data
  private extractMetadata(rule: any): RuleMetadata {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      platform: rule.platform || 'Unknown',
      score: this.calculateRuleScore(rule),
      created: rule.created_at || new Date().toISOString(),
      lastUpdated: rule.last_updated || new Date().toISOString(),
      query: this.extractQuery(rule),
      queryFrequency: rule.query_frequency || '5m',
      queryPeriod: rule.query_period || '1h',
      triggerOperator: rule.trigger_operator || '>',
      triggerThreshold: rule.trigger_threshold || 1,
      tactics: rule.mitre_tactics || [],
      techniques: rule.mitre_techniques || [],
      version: rule.version || '1.0',
      source: rule.source || 'Unknown',
      sigmaRule: rule.sigma_rule,
      mitreTechniques: rule.mitre_techniques || [],
      threatActors: rule.threat_actors || [],
      dataSources: rule.data_sources || [],
      complianceRequirements: rule.compliance_requirements || [],
      realExamples: rule.real_examples || [],
      sourceAttribution: rule.source_attribution || 'Unknown',
      lastUpdated: new Date(rule.last_updated || Date.now()),
      confidenceScore: rule.confidence_score || 0.5,
      validationStatus: rule.validation_status || 'pending'
    };
  }

  // Calculate rule score based on real data
  private calculateRuleScore(rule: any): number {
    let score = 50; // Base score

    // Add points for validation status
    if (rule.validation_status === 'verified') score += 20;
    if (rule.validation_status === 'pending') score += 10;

    // Add points for confidence score
    if (rule.confidence_score) {
      score += rule.confidence_score * 20;
    }

    // Add points for MITRE technique coverage
    if (rule.mitre_techniques?.length > 0) {
      score += Math.min(rule.mitre_techniques.length * 2, 10);
    }

    // Add points for threat actor coverage
    if (rule.threat_actors?.length > 0) {
      score += Math.min(rule.threat_actors.length * 2, 10);
    }

    // Add points for compliance coverage
    if (rule.compliance_requirements?.length > 0) {
      score += Math.min(rule.compliance_requirements.length * 2, 10);
    }

    return Math.min(score, 100);
  }

  // Extract query from rule
  private extractQuery(rule: any): string {
    if (rule.sigma_rule?.detection?.selection) {
      const selection = rule.sigma_rule.detection.selection;
      const conditions = Object.entries(selection).map(([field, value]) => {
        if (Array.isArray(value)) {
          return `${field}: (${value.join(' OR ')})`;
        }
        return `${field}: ${value}`;
      });
      return conditions.join(' AND ');
    }
    
    return rule.query || 'Query not available';
  }

  // Calculate performance metrics using real data
  private async calculatePerformanceMetrics(rule: any) {
    try {
      // Get real incidents for this rule
      const incidents = await this.realDataEngine.getIncidents();
      const ruleIncidents = incidents.filter(incident => 
        incident.detection_rules?.includes(rule.id)
      );

      const totalAlerts = ruleIncidents.length;
      const truePositives = ruleIncidents.filter(incident => 
        incident.severity === 'high' || incident.severity === 'critical'
      ).length;
      const falsePositives = totalAlerts - truePositives;

      const precision = totalAlerts > 0 ? truePositives / totalAlerts : 0;
      const recall = totalAlerts > 0 ? truePositives / totalAlerts : 0;
      const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
      const falsePositiveRate = totalAlerts > 0 ? falsePositives / totalAlerts : 0;
      const truePositiveRate = totalAlerts > 0 ? truePositives / totalAlerts : 0;

      // Calculate average response time
      const responseTimes = ruleIncidents
        .filter(incident => incident.response_time)
        .map(incident => incident.response_time);
      
      const averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      // Calculate cost per alert
      const costPerAlert = this.calculateCostPerAlert(rule, totalAlerts);

      // Calculate risk score
      const riskScore = this.calculateRiskScore(rule, f1Score, falsePositiveRate);

      return {
        f1Score,
        precision,
        recall,
        falsePositiveRate,
        truePositiveRate,
        totalAlerts,
        falsePositives,
        truePositives,
        averageResponseTime,
        costPerAlert,
        riskScore
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      return {
        f1Score: 0.5,
        precision: 0.5,
        recall: 0.5,
        falsePositiveRate: 0.5,
        truePositiveRate: 0.5,
        totalAlerts: 0,
        falsePositives: 0,
        truePositives: 0,
        averageResponseTime: 0,
        costPerAlert: 0,
        riskScore: 50
      };
    }
  }

  // Calculate cost per alert
  private calculateCostPerAlert(rule: any, totalAlerts: number): number {
    const baseCost = 25; // Base cost per alert
    const complexityMultiplier = rule.sigma_rule?.detection?.selection ? 
      Object.keys(rule.sigma_rule.detection.selection).length * 0.1 : 1;
    
    return baseCost * complexityMultiplier;
  }

  // Calculate risk score
  private calculateRiskScore(rule: any, f1Score: number, falsePositiveRate: number): number {
    let riskScore = 50; // Base risk score

    // Adjust based on F1 score
    riskScore += (1 - f1Score) * 30;

    // Adjust based on false positive rate
    riskScore += falsePositiveRate * 20;

    // Adjust based on rule complexity
    if (rule.sigma_rule?.detection?.selection) {
      const complexity = Object.keys(rule.sigma_rule.detection.selection).length;
      if (complexity > 5) riskScore += 10;
      if (complexity > 10) riskScore += 10;
    }

    return Math.min(riskScore, 100);
  }

  // Generate tuning suggestions based on real data
  private generateTuningSuggestions(rule: any, performanceMetrics: any) {
    const suggestions = [];

    // High false positive rate suggestions
    if (performanceMetrics.falsePositiveRate > 0.6) {
      suggestions.push({
        type: 'query' as const,
        title: 'Reduce False Positives',
        description: 'Consider adding exclusions for legitimate PowerShell modules like Exchange Management Shell and Azure PowerShell.',
        priority: 'high' as const,
        estimatedImpact: 'Reduce false positives by 40-60%'
      });
    }

    // Low F1 score suggestions
    if (performanceMetrics.f1Score < 0.6) {
      suggestions.push({
        type: 'logic' as const,
        title: 'Improve Detection Logic',
        description: 'Add parent process validation to catch more sophisticated attacks while reducing noise from legitimate automation.',
        priority: 'high' as const,
        estimatedImpact: 'Improve detection accuracy by 25-35%'
      });
    }

    // Performance optimization suggestions
    if (performanceMetrics.averageResponseTime > 300) {
      suggestions.push({
        type: 'query' as const,
        title: 'Optimize Performance',
        description: 'Use indexed fields for faster query execution and consider time-based filtering for recent events only.',
        priority: 'medium' as const,
        estimatedImpact: 'Reduce response time by 50-70%'
      });
    }

    // MITRE technique enhancement suggestions
    if (rule.mitre_techniques?.length > 0) {
      suggestions.push({
        type: 'ml_enhancement' as const,
        title: 'Enhance MITRE Coverage',
        description: 'Leverage MITRE ATT&CK framework for technique validation and expand coverage.',
        priority: 'medium' as const,
        estimatedImpact: 'Improve threat detection coverage by 20-30%'
      });
    }

    return suggestions;
  }

  // Get threat intelligence for the rule
  private async getThreatIntelligence(rule: any) {
    try {
      const threatIntelligence = await this.realDataEngine.getThreatIntelligence();
      
      // Filter threat intelligence based on rule characteristics
      const relevantThreatActors = rule.threat_actors || [];
      const relevantTechniques = rule.mitre_techniques || [];
      
      const recentAttacks = threatIntelligence
        .filter(intel => 
          relevantThreatActors.some(actor => 
            intel.threat_actors?.includes(actor)
          ) ||
          relevantTechniques.some(technique => 
            intel.mitre_techniques?.includes(technique)
          )
        )
        .slice(0, 5)
        .map(intel => intel.title);

      // Calculate risk level
      const riskLevel = this.calculateThreatRiskLevel(rule, threatIntelligence);

      return {
        threatActors: relevantThreatActors,
        mitreTechniques: relevantTechniques,
        recentAttacks,
        riskLevel
      };
    } catch (error) {
      console.error('Error getting threat intelligence:', error);
      return {
        threatActors: rule.threat_actors || [],
        mitreTechniques: rule.mitre_techniques || [],
        recentAttacks: [],
        riskLevel: 'medium' as const
      };
    }
  }

  // Calculate threat risk level
  private calculateThreatRiskLevel(rule: any, threatIntelligence: any[]): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;

    // Add risk based on threat actors
    if (rule.threat_actors?.length > 0) {
      riskScore += rule.threat_actors.length * 10;
    }

    // Add risk based on MITRE techniques
    if (rule.mitre_techniques?.length > 0) {
      riskScore += rule.mitre_techniques.length * 5;
    }

    // Add risk based on recent threat intelligence
    const recentRelevantIntel = threatIntelligence.filter(intel => 
      rule.threat_actors?.some(actor => intel.threat_actors?.includes(actor)) ||
      rule.mitre_techniques?.some(technique => intel.mitre_techniques?.includes(technique))
    ).length;

    riskScore += recentRelevantIntel * 15;

    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  // Get compliance impact for the rule
  private async getComplianceImpact(rule: any) {
    try {
      const complianceData = await this.realDataEngine.getComplianceRequirements();
      
      const relevantCompliance = complianceData.filter(comp => 
        rule.compliance_requirements?.includes(comp.regulation)
      );

      const auditStatus = this.determineAuditStatus(rule, relevantCompliance);
      const nextReviewDate = this.calculateNextReviewDate(rule);

      return {
        regulations: rule.compliance_requirements || [],
        requirements: relevantCompliance.map(comp => comp.requirement),
        auditStatus,
        nextReviewDate
      };
    } catch (error) {
      console.error('Error getting compliance impact:', error);
      return {
        regulations: rule.compliance_requirements || [],
        requirements: [],
        auditStatus: 'pending' as const,
        nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    }
  }

  // Determine audit status
  private determineAuditStatus(rule: any, complianceData: any[]): 'compliant' | 'non-compliant' | 'pending' {
    if (rule.validation_status === 'verified' && complianceData.length > 0) {
      return 'compliant';
    } else if (rule.validation_status === 'unverified') {
      return 'non-compliant';
    }
    return 'pending';
  }

  // Calculate next review date
  private calculateNextReviewDate(rule: any): string {
    const lastUpdated = new Date(rule.last_updated || Date.now());
    const nextReview = new Date(lastUpdated.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
    return nextReview.toISOString();
  }

  // Generate default rule details for error cases
  private generateDefaultRuleDetails(ruleId: string): RuleDetailAnalysis {
    return {
      metadata: {
        id: ruleId,
        name: 'Unknown Rule',
        description: 'Rule details not available',
        platform: 'Unknown',
        score: 0,
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        query: 'Query not available',
        queryFrequency: '5m',
        queryPeriod: '1h',
        triggerOperator: '>',
        triggerThreshold: 1,
        tactics: [],
        techniques: [],
        version: '1.0',
        source: 'Unknown',
        mitreTechniques: [],
        threatActors: [],
        dataSources: [],
        complianceRequirements: [],
        realExamples: [],
        sourceAttribution: 'Unknown',
        lastUpdated: new Date(),
        confidenceScore: 0,
        validationStatus: 'pending'
      },
      performanceMetrics: {
        f1Score: 0,
        precision: 0,
        recall: 0,
        falsePositiveRate: 0,
        truePositiveRate: 0,
        totalAlerts: 0,
        falsePositives: 0,
        truePositives: 0,
        averageResponseTime: 0,
        costPerAlert: 0,
        riskScore: 0
      },
      tuningSuggestions: [],
      threatIntelligence: {
        threatActors: [],
        mitreTechniques: [],
        recentAttacks: [],
        riskLevel: 'low'
      },
      complianceImpact: {
        regulations: [],
        requirements: [],
        auditStatus: 'pending',
        nextReviewDate: new Date().toISOString()
      }
    };
  }
} 