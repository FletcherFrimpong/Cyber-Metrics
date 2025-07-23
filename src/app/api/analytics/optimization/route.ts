import { NextRequest, NextResponse } from 'next/server';

interface OptimizationRecommendation {
  ruleId: string;
  ruleName: string;
  platform: string;
  currentPerformance: number;
  potentialImprovement: number;
  recommendations: {
    type: 'threshold' | 'logic' | 'data_source' | 'retirement' | 'ml_enhancement';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    estimatedSavings: number;
    implementationSteps: string[];
  }[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedROI: number;
  timeToImplement: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Generate sample optimization recommendations
    const recommendations: OptimizationRecommendation[] = [
      {
        ruleId: 'rule-1',
        ruleName: 'Malware Detection Rule 1',
        platform: 'Microsoft Sentinel',
        currentPerformance: 45,
        potentialImprovement: 35,
        recommendations: [
          {
            type: 'threshold',
            title: 'Adjust Detection Thresholds',
            description: 'Current thresholds are too sensitive, causing high false positive rates',
            impact: 'high',
            effort: 'low',
            estimatedSavings: 15000,
            implementationSteps: [
              'Review historical alert data',
              'Adjust sensitivity from 0.7 to 0.85',
              'Test in staging environment',
              'Monitor for 48 hours before production'
            ]
          },
          {
            type: 'data_source',
            title: 'Add Additional Data Sources',
            description: 'Incorporate endpoint telemetry data to improve detection accuracy',
            impact: 'medium',
            effort: 'medium',
            estimatedSavings: 8000,
            implementationSteps: [
              'Configure endpoint data collection',
              'Update rule logic to include endpoint signals',
              'Validate data flow and latency',
              'Deploy with gradual rollout'
            ]
          }
        ],
        priority: 'critical',
        estimatedROI: 230,
        timeToImplement: '2-3 days'
      },
      {
        ruleId: 'rule-2',
        ruleName: 'Network Anomaly Rule 2',
        platform: 'Splunk',
        currentPerformance: 62,
        potentialImprovement: 28,
        recommendations: [
          {
            type: 'logic',
            title: 'Refine Detection Logic',
            description: 'Current logic doesn\'t account for legitimate network patterns',
            impact: 'high',
            effort: 'medium',
            estimatedSavings: 12000,
            implementationSteps: [
              'Analyze false positive patterns',
              'Update SPL query with exclusion logic',
              'Add business hours filtering',
              'Implement whitelist for known services'
            ]
          }
        ],
        priority: 'high',
        estimatedROI: 180,
        timeToImplement: '1-2 days'
      },
      {
        ruleId: 'rule-3',
        ruleName: 'User Behavior Analytics Rule 3',
        platform: 'CrowdStrike',
        currentPerformance: 78,
        potentialImprovement: 12,
        recommendations: [
          {
            type: 'ml_enhancement',
            title: 'Implement Machine Learning Enhancement',
            description: 'Add ML-based anomaly detection to improve accuracy',
            impact: 'medium',
            effort: 'high',
            estimatedSavings: 6000,
            implementationSteps: [
              'Train ML model on historical data',
              'Integrate with existing rule logic',
              'Validate model performance',
              'Deploy with A/B testing'
            ]
          }
        ],
        priority: 'medium',
        estimatedROI: 120,
        timeToImplement: '1-2 weeks'
      },
      {
        ruleId: 'rule-4',
        ruleName: 'Data Exfiltration Rule 4',
        platform: 'Microsoft Sentinel',
        currentPerformance: 35,
        potentialImprovement: 45,
        recommendations: [
          {
            type: 'retirement',
            title: 'Consider Rule Retirement',
            description: 'Rule has consistently low performance and high maintenance cost',
            impact: 'high',
            effort: 'low',
            estimatedSavings: 20000,
            implementationSteps: [
              'Document current rule performance',
              'Identify replacement detection methods',
              'Plan migration strategy',
              'Execute retirement with monitoring'
            ]
          }
        ],
        priority: 'critical',
        estimatedROI: 300,
        timeToImplement: '3-5 days'
      },
      {
        ruleId: 'rule-5',
        ruleName: 'Privilege Escalation Rule 5',
        platform: 'Splunk',
        currentPerformance: 85,
        potentialImprovement: 8,
        recommendations: [
          {
            type: 'threshold',
            title: 'Fine-tune Alert Thresholds',
            description: 'Minor adjustments to reduce false positives while maintaining detection',
            impact: 'low',
            effort: 'low',
            estimatedSavings: 3000,
            implementationSteps: [
              'Review recent alert patterns',
              'Adjust threshold by 5%',
              'Monitor for 24 hours',
              'Validate no true positives missed'
            ]
          }
        ],
        priority: 'low',
        estimatedROI: 60,
        timeToImplement: '4-6 hours'
      }
    ];

    // Apply filters
    let filteredRecommendations = recommendations;

    if (platform && platform !== 'all') {
      filteredRecommendations = filteredRecommendations.filter(
        rec => rec.platform === platform
      );
    }

    if (priority && priority !== 'all') {
      filteredRecommendations = filteredRecommendations.filter(
        rec => rec.priority === priority
      );
    }

    // Sort by priority and potential improvement
    filteredRecommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.potentialImprovement - a.potentialImprovement;
    });

    // Apply limit
    filteredRecommendations = filteredRecommendations.slice(0, limit);

    // Calculate summary statistics
    const summary = {
      totalRecommendations: filteredRecommendations.length,
      totalPotentialSavings: filteredRecommendations.reduce((sum, rec) => 
        sum + rec.recommendations.reduce((recSum, recItem) => recSum + recItem.estimatedSavings, 0), 0
      ),
      averageROI: Math.round(
        filteredRecommendations.reduce((sum, rec) => sum + rec.estimatedROI, 0) / filteredRecommendations.length
      ),
      priorityDistribution: {
        critical: filteredRecommendations.filter(rec => rec.priority === 'critical').length,
        high: filteredRecommendations.filter(rec => rec.priority === 'high').length,
        medium: filteredRecommendations.filter(rec => rec.priority === 'medium').length,
        low: filteredRecommendations.filter(rec => rec.priority === 'low').length
      },
      platformDistribution: {
        'Microsoft Sentinel': filteredRecommendations.filter(rec => rec.platform === 'Microsoft Sentinel').length,
        'Splunk': filteredRecommendations.filter(rec => rec.platform === 'Splunk').length,
        'CrowdStrike': filteredRecommendations.filter(rec => rec.platform === 'CrowdStrike').length
      }
    };

    return NextResponse.json({
      recommendations: filteredRecommendations,
      summary,
      timestamp: new Date().toISOString(),
      filters: {
        platform: platform || 'all',
        priority: priority || 'all',
        limit
      }
    });

  } catch (error) {
    console.error('Error generating optimization recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate optimization recommendations' },
      { status: 500 }
    );
  }
} 