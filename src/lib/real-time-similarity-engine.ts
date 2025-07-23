import { RealDataIntegrationEngine } from './real-data-integration-engine';

export interface RuleSimilarity {
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

export interface RuleCluster {
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

export interface SimilarityAnalysis {
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

export class RealTimeSimilarityEngine {
  private realDataEngine: RealDataIntegrationEngine;

  constructor() {
    this.realDataEngine = new RealDataIntegrationEngine();
  }

  // Calculate similarity between two rules based on real data
  async calculateRuleSimilarity(rule1: any, rule2: any): Promise<RuleSimilarity> {
    const similarityScore = this.calculateSimilarityScore(rule1, rule2);
    const overlapAreas = this.findOverlapAreas(rule1, rule2);
    const commonTechniques = this.findCommonTechniques(rule1, rule2);
    const commonThreatActors = this.findCommonThreatActors(rule1, rule2);
    const commonCompliance = this.findCommonCompliance(rule1, rule2);
    
    const consolidationPotential = this.assessConsolidationPotential(similarityScore, overlapAreas);
    const consolidationRecommendation = this.generateConsolidationRecommendation(
      rule1, rule2, similarityScore, overlapAreas
    );

    return {
      ruleId1: rule1.id,
      ruleId2: rule2.id,
      similarityScore,
      overlapAreas,
      commonTechniques,
      commonThreatActors,
      commonCompliance,
      consolidationPotential,
      consolidationRecommendation
    };
  }

  // Calculate comprehensive similarity score
  private calculateSimilarityScore(rule1: any, rule2: any): number {
    let totalScore = 0;
    let maxScore = 0;

    // MITRE technique similarity (30% weight)
    const techniqueSimilarity = this.calculateTechniqueSimilarity(rule1, rule2);
    totalScore += techniqueSimilarity * 0.3;
    maxScore += 0.3;

    // Threat actor similarity (25% weight)
    const threatActorSimilarity = this.calculateThreatActorSimilarity(rule1, rule2);
    totalScore += threatActorSimilarity * 0.25;
    maxScore += 0.25;

    // Compliance requirement similarity (20% weight)
    const complianceSimilarity = this.calculateComplianceSimilarity(rule1, rule2);
    totalScore += complianceSimilarity * 0.2;
    maxScore += 0.2;

    // Query logic similarity (15% weight)
    const querySimilarity = this.calculateQuerySimilarity(rule1, rule2);
    totalScore += querySimilarity * 0.15;
    maxScore += 0.15;

    // Data source similarity (10% weight)
    const dataSourceSimilarity = this.calculateDataSourceSimilarity(rule1, rule2);
    totalScore += dataSourceSimilarity * 0.1;
    maxScore += 0.1;

    return totalScore / maxScore;
  }

  // Calculate MITRE technique similarity
  private calculateTechniqueSimilarity(rule1: any, rule2: any): number {
    const techniques1 = rule1.mitre_techniques || [];
    const techniques2 = rule2.mitre_techniques || [];

    if (techniques1.length === 0 && techniques2.length === 0) return 0.5; // Neutral if both have no techniques
    if (techniques1.length === 0 || techniques2.length === 0) return 0.1; // Low similarity if one has no techniques

    const intersection = techniques1.filter((t: string) => techniques2.includes(t));
    const union = [...new Set([...techniques1, ...techniques2])];

    return intersection.length / union.length;
  }

  // Calculate threat actor similarity
  private calculateThreatActorSimilarity(rule1: any, rule2: any): number {
    const actors1 = rule1.threat_actors || [];
    const actors2 = rule2.threat_actors || [];

    if (actors1.length === 0 && actors2.length === 0) return 0.5;
    if (actors1.length === 0 || actors2.length === 0) return 0.1;

    const intersection = actors1.filter((a: string) => actors2.includes(a));
    const union = [...new Set([...actors1, ...actors2])];

    return intersection.length / union.length;
  }

  // Calculate compliance requirement similarity
  private calculateComplianceSimilarity(rule1: any, rule2: any): number {
    const compliance1 = rule1.compliance_requirements || [];
    const compliance2 = rule2.compliance_requirements || [];

    if (compliance1.length === 0 && compliance2.length === 0) return 0.5;
    if (compliance1.length === 0 || compliance2.length === 0) return 0.1;

    const intersection = compliance1.filter((c: string) => compliance2.includes(c));
    const union = [...new Set([...compliance1, ...compliance2])];

    return intersection.length / union.length;
  }

  // Calculate query logic similarity
  private calculateQuerySimilarity(rule1: any, rule2: any): number {
    const query1 = rule1.sigma_rule?.detection?.selection || {};
    const query2 = rule2.sigma_rule?.detection?.selection || {};

    const keys1 = Object.keys(query1);
    const keys2 = Object.keys(query2);

    if (keys1.length === 0 && keys2.length === 0) return 0.5;
    if (keys1.length === 0 || keys2.length === 0) return 0.1;

    const commonKeys = keys1.filter(k => keys2.includes(k));
    const totalKeys = [...new Set([...keys1, ...keys2])];

    return commonKeys.length / totalKeys.length;
  }

  // Calculate data source similarity
  private calculateDataSourceSimilarity(rule1: any, rule2: any): number {
    const sources1 = rule1.data_sources || [];
    const sources2 = rule2.data_sources || [];

    if (sources1.length === 0 && sources2.length === 0) return 0.5;
    if (sources1.length === 0 || sources2.length === 0) return 0.1;

    const intersection = sources1.filter(s => sources2.includes(s));
    const union = [...new Set([...sources1, ...sources2])];

    return intersection.length / union.length;
  }

  // Find overlap areas between rules
  private findOverlapAreas(rule1: any, rule2: any): string[] {
    const overlaps: string[] = [];

    // Check MITRE technique overlap
    const techniques1 = rule1.mitre_techniques || [];
    const techniques2 = rule2.mitre_techniques || [];
    if (techniques1.some(t => techniques2.includes(t))) {
      overlaps.push('MITRE Techniques');
    }

    // Check threat actor overlap
    const actors1 = rule1.threat_actors || [];
    const actors2 = rule2.threat_actors || [];
    if (actors1.some(a => actors2.includes(a))) {
      overlaps.push('Threat Actors');
    }

    // Check compliance overlap
    const compliance1 = rule1.compliance_requirements || [];
    const compliance2 = rule2.compliance_requirements || [];
    if (compliance1.some(c => compliance2.includes(c))) {
      overlaps.push('Compliance Requirements');
    }

    // Check data source overlap
    const sources1 = rule1.data_sources || [];
    const sources2 = rule2.data_sources || [];
    if (sources1.some((s: string) => sources2.includes(s))) {
      overlaps.push('Data Sources');
    }

    return overlaps;
  }

  // Find common MITRE techniques
  private findCommonTechniques(rule1: any, rule2: any): string[] {
    const techniques1 = rule1.mitre_techniques || [];
    const techniques2 = rule2.mitre_techniques || [];
    return techniques1.filter((t: string) => techniques2.includes(t));
  }

  // Find common threat actors
  private findCommonThreatActors(rule1: any, rule2: any): string[] {
    const actors1 = rule1.threat_actors || [];
    const actors2 = rule2.threat_actors || [];
    return actors1.filter((a: string) => actors2.includes(a));
  }

  // Find common compliance requirements
  private findCommonCompliance(rule1: any, rule2: any): string[] {
    const compliance1 = rule1.compliance_requirements || [];
    const compliance2 = rule2.compliance_requirements || [];
    return compliance1.filter((c: string) => compliance2.includes(c));
  }

  // Assess consolidation potential
  private assessConsolidationPotential(similarityScore: number, overlapAreas: string[]): 'high' | 'medium' | 'low' {
    if (similarityScore >= 0.8 && overlapAreas.length >= 3) return 'high';
    if (similarityScore >= 0.6 && overlapAreas.length >= 2) return 'medium';
    return 'low';
  }

  // Generate consolidation recommendation
  private generateConsolidationRecommendation(
    rule1: any, 
    rule2: any, 
    similarityScore: number, 
    overlapAreas: string[]
  ): string {
    if (similarityScore >= 0.8) {
      return `High similarity detected. Consider consolidating ${rule1.name} and ${rule2.name} into a single rule with combined logic.`;
    } else if (similarityScore >= 0.6) {
      return `Medium similarity detected. Review ${rule1.name} and ${rule2.name} for potential optimization opportunities.`;
    } else {
      return `Low similarity. Rules ${rule1.name} and ${rule2.name} appear to serve different purposes.`;
    }
  }

  // Generate similarity matrix for all rules
  async generateSimilarityMatrix(rules: any[]): Promise<SimilarityAnalysis> {
    const ruleIds = rules.map(r => r.id);
    const similarityMatrix: number[][] = [];
    const similarities: RuleSimilarity[] = [];

    // Calculate similarity for each pair of rules
    for (let i = 0; i < rules.length; i++) {
      similarityMatrix[i] = [];
      for (let j = 0; j < rules.length; j++) {
        if (i === j) {
          similarityMatrix[i][j] = 1.0; // Self-similarity
        } else {
          const similarity = await this.calculateRuleSimilarity(rules[i], rules[j]);
          similarityMatrix[i][j] = similarity.similarityScore;
          similarities.push(similarity);
        }
      }
    }

    // Generate clusters
    const clusters = this.generateClusters(rules, similarities);

    // Calculate consolidation opportunities
    const consolidationOpportunities = this.calculateConsolidationOpportunities(similarities);

    // Calculate estimated cost savings
    const estimatedCostSavings = this.calculateEstimatedSavings(clusters, rules);

    // Generate recommendations
    const recommendations = this.generateRecommendations(clusters, similarities);

    return {
      rules: ruleIds,
      similarityMatrix,
      clusters,
      consolidationOpportunities,
      estimatedCostSavings,
      recommendations
    };
  }

  // Generate rule clusters
  private generateClusters(rules: any[], similarities: RuleSimilarity[]): RuleCluster[] {
    const clusters: RuleCluster[] = [];
    const processedRules = new Set<string>();

    // Find high-similarity groups
    const highSimilarityGroups = this.findHighSimilarityGroups(similarities, 0.7);

    highSimilarityGroups.forEach((group, index) => {
      const clusterRules = group.map(s => s.ruleId1).concat(group[0].ruleId2);
      const uniqueRules = [...new Set(clusterRules)];
      
      if (uniqueRules.length >= 2) {
        const ruleObjects = rules.filter(r => uniqueRules.includes(r.id));
        const commonTechniques = this.findCommonTechniquesForGroup(ruleObjects);
        const commonThreatActors = this.findCommonThreatActorsForGroup(ruleObjects);
        const consolidationOpportunities = this.findConsolidationOpportunitiesForGroup(ruleObjects);
        const estimatedSavings = this.calculateClusterSavings(ruleObjects);

        clusters.push({
          id: `cluster-${index + 1}`,
          name: this.generateClusterName(ruleObjects),
          rules: uniqueRules,
          similarity: this.calculateAverageSimilarity(group),
          color: this.getClusterColor(index),
          commonTechniques,
          commonThreatActors,
          consolidationOpportunities,
          estimatedSavings
        });

        uniqueRules.forEach(ruleId => processedRules.add(ruleId));
      }
    });

    // Add remaining rules as individual clusters
    rules.forEach(rule => {
      if (!processedRules.has(rule.id)) {
        clusters.push({
          id: `cluster-${clusters.length + 1}`,
          name: `${rule.name} (Standalone)`,
          rules: [rule.id],
          similarity: 1.0,
          color: 'bg-gray-500',
          commonTechniques: rule.mitre_techniques || [],
          commonThreatActors: rule.threat_actors || [],
          consolidationOpportunities: [],
          estimatedSavings: 0
        });
      }
    });

    return clusters;
  }

  // Find high similarity groups
  private findHighSimilarityGroups(similarities: RuleSimilarity[], threshold: number): RuleSimilarity[][] {
    const groups: RuleSimilarity[][] = [];
    const processed = new Set<string>();

    similarities.forEach(similarity => {
      if (similarity.similarityScore >= threshold && !processed.has(similarity.ruleId1) && !processed.has(similarity.ruleId2)) {
        const group = [similarity];
        processed.add(similarity.ruleId1);
        processed.add(similarity.ruleId2);

        // Find related similarities
        similarities.forEach(other => {
          if (other.similarityScore >= threshold && 
              (other.ruleId1 === similarity.ruleId1 || other.ruleId1 === similarity.ruleId2 ||
               other.ruleId2 === similarity.ruleId1 || other.ruleId2 === similarity.ruleId2)) {
            group.push(other);
            processed.add(other.ruleId1);
            processed.add(other.ruleId2);
          }
        });

        groups.push(group);
      }
    });

    return groups;
  }

  // Find common techniques for a group of rules
  private findCommonTechniquesForGroup(rules: any[]): string[] {
    if (rules.length === 0) return [];
    
    const allTechniques = rules.map(r => r.mitre_techniques || []).flat();
    const techniqueCounts = allTechniques.reduce((acc: Record<string, number>, tech: string) => {
      acc[tech] = (acc[tech] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(techniqueCounts)
      .filter(([_, count]) => (count as number) >= Math.ceil(rules.length * 0.5))
      .map(([tech, _]) => tech);
  }

  // Find common threat actors for a group of rules
  private findCommonThreatActorsForGroup(rules: any[]): string[] {
    if (rules.length === 0) return [];
    
    const allActors = rules.map(r => r.threat_actors || []).flat();
    const actorCounts = allActors.reduce((acc: Record<string, number>, actor: string) => {
      acc[actor] = (acc[actor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(actorCounts)
      .filter(([_, count]) => (count as number) >= Math.ceil(rules.length * 0.5))
      .map(([actor, _]) => actor);
  }

  // Find consolidation opportunities for a group
  private findConsolidationOpportunitiesForGroup(rules: any[]): string[] {
    const opportunities: string[] = [];
    
    if (rules.length >= 2) {
      opportunities.push(`Consolidate ${rules.length} rules into a single comprehensive rule`);
      opportunities.push('Share common MITRE technique coverage');
      opportunities.push('Unified threat actor detection');
    }

    return opportunities;
  }

  // Calculate cluster savings
  private calculateClusterSavings(rules: any[]): number {
    // Estimate savings based on rule consolidation
    const baseSavings = 5000; // Base savings per consolidated rule
    const consolidationSavings = (rules.length - 1) * baseSavings;
    const maintenanceSavings = rules.length * 2000; // Reduced maintenance costs
    
    return consolidationSavings + maintenanceSavings;
  }

  // Generate cluster name
  private generateClusterName(rules: any[]): string {
    const commonTechniques = this.findCommonTechniquesForGroup(rules);
    const commonActors = this.findCommonThreatActorsForGroup(rules);
    
    if (commonTechniques.length > 0) {
      return `${commonTechniques[0]} Detection Cluster`;
    } else if (commonActors.length > 0) {
      return `${commonActors[0]} Threat Cluster`;
    } else {
      return `Detection Rule Cluster (${rules.length} rules)`;
    }
  }

  // Calculate average similarity for a group
  private calculateAverageSimilarity(group: RuleSimilarity[]): number {
    if (group.length === 0) return 0;
    const total = group.reduce((sum, s) => sum + s.similarityScore, 0);
    return total / group.length;
  }

  // Get cluster color
  private getClusterColor(index: number): string {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
    return colors[index % colors.length];
  }

  // Calculate consolidation opportunities
  private calculateConsolidationOpportunities(similarities: RuleSimilarity[]): { high: number; medium: number; low: number } {
    const high = similarities.filter(s => s.consolidationPotential === 'high').length;
    const medium = similarities.filter(s => s.consolidationPotential === 'medium').length;
    const low = similarities.filter(s => s.consolidationPotential === 'low').length;

    return { high, medium, low };
  }

  // Calculate estimated savings
  private calculateEstimatedSavings(clusters: RuleCluster[], rules: any[]): number {
    return clusters.reduce((total, cluster) => total + cluster.estimatedSavings, 0);
  }

  // Generate recommendations
  private generateRecommendations(clusters: RuleCluster[], similarities: RuleSimilarity[]): string[] {
    const recommendations: string[] = [];

    // High consolidation opportunities
    const highOpportunities = similarities.filter(s => s.consolidationPotential === 'high');
    if (highOpportunities.length > 0) {
      recommendations.push(`Prioritize consolidation of ${highOpportunities.length} high-similarity rule pairs`);
    }

    // Cluster-based recommendations
    clusters.forEach(cluster => {
      if (cluster.rules.length > 2) {
        recommendations.push(`Consider consolidating ${cluster.name} (${cluster.rules.length} rules) for estimated $${cluster.estimatedSavings.toLocaleString()} savings`);
      }
    });

    // General recommendations
    if (similarities.length > 0) {
      const avgSimilarity = similarities.reduce((sum, s) => sum + s.similarityScore, 0) / similarities.length;
      if (avgSimilarity > 0.6) {
        recommendations.push('Overall rule similarity is high - consider comprehensive rule consolidation review');
      }
    }

    return recommendations;
  }
} 