import { promises as fs } from 'fs';
import path from 'path';

export interface RuleEmbedding {
  ruleId: string;
  embedding: number[];
  ruleName: string;
  query: string;
  category: string;
  platform: string;
  similarityScore?: number;
}

export interface RuleCluster {
  clusterId: string;
  centroid: number[];
  rules: RuleEmbedding[];
  similarity: number;
  overlapPercentage: number;
  redundantRules: string[];
  optimizationOpportunities: string[];
  coverageGaps: string[];
}

export interface ClusteringAnalysis {
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

export interface SimilarityMatrix {
  ruleId: string;
  similarities: Record<string, number>;
  averageSimilarity: number;
  mostSimilar: string[];
}

export class RuleClusteringEngine {
  private rulesPath: string;
  private embeddingsPath: string;
  private clustersPath: string;
  private similarityMatrixPath: string;

  constructor() {
    this.rulesPath = path.join(process.cwd(), 'src/data/sentinel-rules.json');
    this.embeddingsPath = path.join(process.cwd(), 'src/data/rule-embeddings.json');
    this.clustersPath = path.join(process.cwd(), 'src/data/rule-clusters.json');
    this.similarityMatrixPath = path.join(process.cwd(), 'src/data/similarity-matrix.json');
  }

  async generateRuleEmbeddings(): Promise<RuleEmbedding[]> {
    const rules = await this.loadRules();
    const embeddings: RuleEmbedding[] = [];

    for (const rule of rules) {
      const embedding = await this.createRuleEmbedding(rule);
      embeddings.push(embedding);
    }

    await this.saveEmbeddings(embeddings);
    return embeddings;
  }

  async clusterRules(threshold: number = 0.7): Promise<ClusteringAnalysis> {
    const embeddings = await this.loadEmbeddings();
    const clusters: RuleCluster[] = [];
    const processedRules = new Set<string>();

    // Create similarity matrix
    const similarityMatrix = this.createSimilarityMatrix(embeddings);
    await this.saveSimilarityMatrix(similarityMatrix);

    // Perform clustering using similarity threshold
    for (const embedding of embeddings) {
      if (processedRules.has(embedding.ruleId)) continue;

      const cluster = this.createRuleCluster(embedding, embeddings, threshold);
      if (cluster.rules.length > 1) {
        clusters.push(cluster);
        cluster.rules.forEach(rule => processedRules.add(rule.ruleId));
      }
    }

    // Analyze clusters for optimization opportunities
    const analysis = this.analyzeClusters(clusters, embeddings);
    await this.saveClusters(clusters);

    return analysis;
  }

  async findSimilarRules(targetRuleId: string, threshold: number = 0.7): Promise<RuleEmbedding[]> {
    const embeddings = await this.loadEmbeddings();
    const targetEmbedding = embeddings.find(e => e.ruleId === targetRuleId);
    
    if (!targetEmbedding) {
      throw new Error(`Rule ${targetRuleId} not found`);
    }

    const similarRules = embeddings
      .filter(e => e.ruleId !== targetRuleId)
      .map(e => ({
        ...e,
        similarityScore: this.calculateCosineSimilarity(targetEmbedding.embedding, e.embedding)
      }))
      .filter(e => e.similarityScore >= threshold)
      .sort((a, b) => b.similarityScore! - a.similarityScore!);

    return similarRules;
  }

  async getRuleOverlapAnalysis(ruleId: string): Promise<{
    overlappingRules: RuleEmbedding[];
    overlapDetails: any[];
    optimizationSuggestions: string[];
  }> {
    const similarRules = await this.findSimilarRules(ruleId, 0.6);
    const overlapDetails = this.analyzeRuleOverlap(ruleId, similarRules);
    const optimizationSuggestions = this.generateOptimizationSuggestions(ruleId, similarRules);

    return {
      overlappingRules: similarRules,
      overlapDetails,
      optimizationSuggestions
    };
  }

  async getCoverageGapAnalysis(): Promise<{
    gaps: any[];
    recommendations: string[];
    riskAssessment: any;
  }> {
    const embeddings = await this.loadEmbeddings();
    const clusters = await this.loadClusters();
    
    const gaps = this.identifyCoverageGaps(embeddings, clusters);
    const recommendations = this.generateCoverageRecommendations(gaps);
    const riskAssessment = this.assessCoverageRisk(gaps);

    return {
      gaps,
      recommendations,
      riskAssessment
    };
  }

  private async createRuleEmbedding(rule: any): Promise<RuleEmbedding> {
    // Create a feature vector from rule properties
    const features = this.extractRuleFeatures(rule);
    const embedding = this.normalizeFeatures(features);

    return {
      ruleId: rule.id,
      embedding,
      ruleName: rule.name,
      query: rule.query,
      category: rule.category || 'unknown',
      platform: rule.platform || 'sentinel'
    };
  }

  private extractRuleFeatures(rule: any): number[] {
    const features: number[] = [];
    
    // Query complexity features
    const query = rule.query.toLowerCase();
    features.push(
      (query.match(/where/g) || []).length, // Number of filter conditions
      (query.match(/summarize/g) || []).length, // Number of aggregations
      (query.match(/extend/g) || []).length, // Number of extensions
      (query.match(/join/g) || []).length, // Number of joins
      (query.match(/union/g) || []).length, // Number of unions
      query.length / 100, // Query length (normalized)
      (query.match(/contains|like|startswith|endswith/g) || []).length, // String operations
      (query.match(/count|sum|avg|max|min/g) || []).length, // Aggregation functions
      (query.match(/and|or|not/g) || []).length, // Logical operators
      (query.match(/in\(|has_any|has_all/g) || []).length // Set operations
    );

    // Threat category encoding
    const categoryFeatures = this.encodeCategory(rule.category);
    features.push(...categoryFeatures);

    // Platform features
    const platformFeatures = this.encodePlatform(rule.platform);
    features.push(...platformFeatures);

    return features;
  }

  private encodeCategory(category: string): number[] {
    const categories = [
      'ransomware', 'malware', 'phishing', 'data-exfiltration', 
      'privilege-escalation', 'lateral-movement', 'persistence', 'defense-evasion'
    ];
    
    return categories.map(cat => 
      category?.toLowerCase().includes(cat) ? 1 : 0
    );
  }

  private encodePlatform(platform: string): number[] {
    const platforms = ['sentinel', 'splunk', 'qradar', 'exabeam', 'custom'];
    
    return platforms.map(plat => 
      platform?.toLowerCase().includes(plat) ? 1 : 0
    );
  }

  private normalizeFeatures(features: number[]): number[] {
    const maxValues = features.map((_, i) => 
      Math.max(...features.map(f => Math.abs(f)))
    );
    
    return features.map((f, i) => 
      maxValues[i] > 0 ? f / maxValues[i] : 0
    );
  }

  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  private createSimilarityMatrix(embeddings: RuleEmbedding[]): SimilarityMatrix[] {
    const matrix: SimilarityMatrix[] = [];

    for (const embedding1 of embeddings) {
      const similarities: Record<string, number> = {};
      const ruleSimilarities: number[] = [];

      for (const embedding2 of embeddings) {
        if (embedding1.ruleId === embedding2.ruleId) {
          similarities[embedding2.ruleId] = 1.0;
          ruleSimilarities.push(1.0);
        } else {
          const similarity = this.calculateCosineSimilarity(embedding1.embedding, embedding2.embedding);
          similarities[embedding2.ruleId] = similarity;
          ruleSimilarities.push(similarity);
        }
      }

      const averageSimilarity = ruleSimilarities.reduce((sum, val) => sum + val, 0) / ruleSimilarities.length;
      const mostSimilar = Object.entries(similarities)
        .filter(([id, sim]) => id !== embedding1.ruleId && sim > 0.5)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id);

      matrix.push({
        ruleId: embedding1.ruleId,
        similarities,
        averageSimilarity,
        mostSimilar
      });
    }

    return matrix;
  }

  private createRuleCluster(target: RuleEmbedding, allEmbeddings: RuleEmbedding[], threshold: number): RuleCluster {
    const similarRules = [target];
    
    for (const embedding of allEmbeddings) {
      if (embedding.ruleId === target.ruleId) continue;
      
      const similarity = this.calculateCosineSimilarity(target.embedding, embedding.embedding);
      if (similarity >= threshold) {
        similarRules.push({ ...embedding, similarityScore: similarity });
      }
    }

    const centroid = this.calculateCentroid(similarRules.map(r => r.embedding));
    const clusterId = `cluster-${target.ruleId}-${Date.now()}`;

    return {
      clusterId,
      centroid,
      rules: similarRules,
      similarity: this.calculateAverageSimilarity(similarRules),
      overlapPercentage: this.calculateOverlapPercentage(similarRules),
      redundantRules: this.identifyRedundantRules(similarRules),
      optimizationOpportunities: this.generateClusterOptimizations(similarRules),
      coverageGaps: this.identifyClusterCoverageGaps(similarRules)
    };
  }

  private calculateCentroid(embeddings: number[][]): number[] {
    const dimensions = embeddings[0].length;
    const centroid = new Array(dimensions).fill(0);
    
    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += embedding[i];
      }
    }
    
    return centroid.map(val => val / embeddings.length);
  }

  private calculateAverageSimilarity(rules: RuleEmbedding[]): number {
    if (rules.length < 2) return 1.0;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const similarity = this.calculateCosineSimilarity(rules[i].embedding, rules[j].embedding);
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 1.0;
  }

  private calculateOverlapPercentage(rules: RuleEmbedding[]): number {
    if (rules.length < 2) return 0;
    
    // Analyze query overlap
    const queries = rules.map(r => r.query.toLowerCase());
    let overlapCount = 0;
    
    for (let i = 0; i < queries.length; i++) {
      for (let j = i + 1; j < queries.length; j++) {
        const overlap = this.calculateQueryOverlap(queries[i], queries[j]);
        overlapCount += overlap;
      }
    }
    
    const totalComparisons = (queries.length * (queries.length - 1)) / 2;
    return totalComparisons > 0 ? (overlapCount / totalComparisons) * 100 : 0;
  }

  private calculateQueryOverlap(query1: string, query2: string): number {
    const words1 = new Set(query1.split(/\s+/));
    const words2 = new Set(query2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private identifyRedundantRules(rules: RuleEmbedding[]): string[] {
    const redundant: string[] = [];
    
    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const similarity = this.calculateCosineSimilarity(rules[i].embedding, rules[j].embedding);
        if (similarity > 0.9) {
          // Consider the rule with lower performance as redundant
          const redundantRule = rules[i].similarityScore! < rules[j].similarityScore! ? rules[i] : rules[j];
          redundant.push(redundantRule.ruleId);
        }
      }
    }
    
    return [...new Set(redundant)];
  }

  private generateClusterOptimizations(rules: RuleEmbedding[]): string[] {
    const optimizations: string[] = [];
    
    if (rules.length > 3) {
      optimizations.push('Consider consolidating multiple similar rules into a single comprehensive rule');
    }
    
    if (this.calculateOverlapPercentage(rules) > 70) {
      optimizations.push('High query overlap detected - merge overlapping conditions');
    }
    
    const categories = new Set(rules.map(r => r.category));
    if (categories.size === 1) {
      optimizations.push('All rules target same threat category - consider unified approach');
    }
    
    return optimizations;
  }

  private identifyClusterCoverageGaps(rules: RuleEmbedding[]): string[] {
    const gaps: string[] = [];
    const categories = rules.map(r => r.category);
    
    // Check for missing threat categories
    const expectedCategories = [
      'ransomware', 'malware', 'phishing', 'data-exfiltration',
      'privilege-escalation', 'lateral-movement'
    ];
    
    for (const expected of expectedCategories) {
      if (!categories.some(cat => cat.toLowerCase().includes(expected))) {
        gaps.push(`Missing coverage for ${expected} threats`);
      }
    }
    
    return gaps;
  }

  private analyzeClusters(clusters: RuleCluster[], allEmbeddings: RuleEmbedding[]): ClusteringAnalysis {
    const totalRules = allEmbeddings.length;
    const redundantRules = clusters.reduce((sum, cluster) => sum + cluster.redundantRules.length, 0);
    const coverageGaps = clusters.reduce((sum, cluster) => sum + cluster.coverageGaps.length, 0);
    
    const optimizationScore = Math.max(0, 100 - (redundantRules / totalRules) * 100);
    
    const recommendations = this.generateAnalysisRecommendations(clusters, totalRules, redundantRules);
    
    return {
      clusters,
      totalRules,
      redundantRules,
      coverageGaps,
      optimizationScore,
      recommendations
    };
  }

  private generateAnalysisRecommendations(clusters: RuleCluster[], totalRules: number, redundantRules: number): any {
    const recommendations = {
      immediate: [] as string[],
      shortTerm: [] as string[],
      longTerm: [] as string[]
    };
    
    if (redundantRules > totalRules * 0.2) {
      recommendations.immediate.push('High redundancy detected - prioritize rule consolidation');
    }
    
    if (clusters.length > totalRules * 0.3) {
      recommendations.shortTerm.push('Too many small clusters - consider merging similar rules');
    }
    
    if (clusters.some(c => c.overlapPercentage > 80)) {
      recommendations.shortTerm.push('Critical overlap detected - immediate consolidation required');
    }
    
    recommendations.longTerm.push('Implement automated rule similarity monitoring');
    
    return recommendations;
  }

  private analyzeRuleOverlap(ruleId: string, similarRules: RuleEmbedding[]): any[] {
    const overlaps: any[] = [];
    
    for (const similar of similarRules) {
      const overlap = {
        ruleId: similar.ruleId,
        ruleName: similar.ruleName,
        similarity: similar.similarityScore,
        overlapType: this.determineOverlapType(ruleId, similar.ruleId),
        impact: this.assessOverlapImpact(similar.similarityScore!)
      };
      overlaps.push(overlap);
    }
    
    return overlaps;
  }

  private determineOverlapType(rule1: string, rule2: string): string {
    // Analyze overlap patterns
    if (rule1.includes('initial') && rule2.includes('initial')) return 'Initial Access Overlap';
    if (rule1.includes('persistence') && rule2.includes('persistence')) return 'Persistence Overlap';
    if (rule1.includes('lateral') && rule2.includes('lateral')) return 'Lateral Movement Overlap';
    return 'General Logic Overlap';
  }

  private assessOverlapImpact(similarity: number): 'low' | 'medium' | 'high' {
    if (similarity > 0.9) return 'high';
    if (similarity > 0.7) return 'medium';
    return 'low';
  }

  private generateOptimizationSuggestions(ruleId: string, similarRules: RuleEmbedding[]): string[] {
    const suggestions: string[] = [];
    
    if (similarRules.length > 5) {
      suggestions.push('Consider creating a unified rule to replace multiple similar rules');
    }
    
    const highSimilarity = similarRules.filter(r => r.similarityScore! > 0.8);
    if (highSimilarity.length > 0) {
      suggestions.push('Merge high-similarity rules to reduce redundancy');
    }
    
    suggestions.push('Review query conditions to eliminate unnecessary overlap');
    suggestions.push('Implement rule versioning to track optimization changes');
    
    return suggestions;
  }

  private identifyCoverageGaps(embeddings: RuleEmbedding[], clusters: RuleCluster[]): any[] {
    const gaps: any[] = [];
    
    // Analyze threat coverage
    const coveredThreats = new Set(embeddings.map(e => e.category));
    const expectedThreats = [
      'ransomware', 'malware', 'phishing', 'data-exfiltration',
      'privilege-escalation', 'lateral-movement', 'persistence'
    ];
    
    for (const threat of expectedThreats) {
      if (!Array.from(coveredThreats).some(cat => cat.toLowerCase().includes(threat))) {
        gaps.push({
          type: 'threat-coverage',
          description: `Missing detection rules for ${threat} threats`,
          severity: 'high',
          recommendation: `Implement ${threat} detection rules`
        });
      }
    }
    
    // Analyze platform coverage
    const platforms = new Set(embeddings.map(e => e.platform));
    if (platforms.size < 3) {
      gaps.push({
        type: 'platform-coverage',
        description: 'Limited platform coverage detected',
        severity: 'medium',
        recommendation: 'Extend rules to cover additional platforms'
      });
    }
    
    return gaps;
  }

  private generateCoverageRecommendations(gaps: any[]): string[] {
    const recommendations: string[] = [];
    
    for (const gap of gaps) {
      recommendations.push(gap.recommendation);
    }
    
    if (gaps.length === 0) {
      recommendations.push('Coverage appears comprehensive - focus on optimization');
    }
    
    return recommendations;
  }

  private assessCoverageRisk(gaps: any[]): any {
    const highSeverity = gaps.filter(g => g.severity === 'high').length;
    const mediumSeverity = gaps.filter(g => g.severity === 'medium').length;
    
    const riskScore = (highSeverity * 3 + mediumSeverity * 1) / 10;
    
    return {
      riskScore: Math.min(100, riskScore * 100),
      riskLevel: riskScore > 0.7 ? 'high' : riskScore > 0.3 ? 'medium' : 'low',
      highSeverityGaps: highSeverity,
      mediumSeverityGaps: mediumSeverity
    };
  }

  private async loadRules(): Promise<any[]> {
    try {
      const data = await fs.readFile(this.rulesPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async loadEmbeddings(): Promise<RuleEmbedding[]> {
    try {
      const data = await fs.readFile(this.embeddingsPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveEmbeddings(embeddings: RuleEmbedding[]): Promise<void> {
    await fs.writeFile(this.embeddingsPath, JSON.stringify(embeddings, null, 2));
  }

  private async loadClusters(): Promise<RuleCluster[]> {
    try {
      const data = await fs.readFile(this.clustersPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveClusters(clusters: RuleCluster[]): Promise<void> {
    await fs.writeFile(this.clustersPath, JSON.stringify(clusters, null, 2));
  }

  private async saveSimilarityMatrix(matrix: SimilarityMatrix[]): Promise<void> {
    await fs.writeFile(this.similarityMatrixPath, JSON.stringify(matrix, null, 2));
  }
} 