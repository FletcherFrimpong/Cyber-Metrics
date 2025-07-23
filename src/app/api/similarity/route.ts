import { NextRequest, NextResponse } from 'next/server';
import { RealTimeSimilarityEngine } from '@/lib/real-time-similarity-engine';
import { RealDataIntegrationEngine } from '@/lib/real-data-integration-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'analyze';
    
    console.log('Similarity API endpoint called');
    console.log('Action:', action);

    const similarityEngine = new RealTimeSimilarityEngine();
    const realDataEngine = new RealDataIntegrationEngine();

    switch (action) {
      case 'analyze':
        try {
          // Get real detection rules
          console.log('Fetching detection rules...');
          const rules = await realDataEngine.getRealDetectionRules();
          console.log(`Analyzing similarity for ${rules.length} rules`);

          if (!rules || rules.length === 0) {
            throw new Error('No detection rules found');
          }

          // Generate similarity analysis
          console.log('Generating similarity matrix...');
          const analysis = await similarityEngine.generateSimilarityMatrix(rules);
          
          console.log('Similarity analysis completed');
          console.log(`Generated ${analysis.clusters.length} clusters`);
          console.log(`Found ${analysis.consolidationOpportunities.high} high consolidation opportunities`);

          return NextResponse.json({
            success: true,
            data: analysis,
            metadata: {
              totalRules: rules.length,
              analysisTimestamp: new Date().toISOString(),
              dataSource: 'Real Detection Rules',
              confidence: 'high'
            }
          });
        } catch (innerError) {
          console.error('Error in analyze action:', innerError);
          return NextResponse.json(
            { error: `Analysis failed: ${innerError instanceof Error ? innerError.message : 'Unknown error'}` },
            { status: 500 }
          );
        }

      case 'cluster-details':
        const clusterId = searchParams.get('clusterId');
        if (!clusterId) {
          return NextResponse.json({ error: 'Cluster ID required' }, { status: 400 });
        }

        const rulesForCluster = await realDataEngine.getRealDetectionRules();
        const clusterAnalysis = await similarityEngine.generateSimilarityMatrix(rulesForCluster);
        const cluster = clusterAnalysis.clusters.find(c => c.id === clusterId);

        if (!cluster) {
          return NextResponse.json({ error: 'Cluster not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: cluster,
          metadata: {
            analysisTimestamp: new Date().toISOString(),
            dataSource: 'Real Detection Rules'
          }
        });

      case 'consolidation-opportunities':
        const rulesForOpportunities = await realDataEngine.getRealDetectionRules();
        const opportunitiesAnalysis = await similarityEngine.generateSimilarityMatrix(rulesForOpportunities);

        return NextResponse.json({
          success: true,
          data: {
            opportunities: opportunitiesAnalysis.consolidationOpportunities,
            estimatedSavings: opportunitiesAnalysis.estimatedCostSavings,
            recommendations: opportunitiesAnalysis.recommendations
          },
          metadata: {
            analysisTimestamp: new Date().toISOString(),
            dataSource: 'Real Detection Rules'
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in similarity analysis:', error);
    return NextResponse.json(
      { error: `Failed to perform similarity analysis: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 