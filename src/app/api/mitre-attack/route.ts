import { NextRequest, NextResponse } from 'next/server';
import { MITREAttackMapper } from '@/lib/mitre-attack-mapper';

const mitreMapper = new MITREAttackMapper();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');
    const techniques = searchParams.get('techniques')?.split(',');
    const action = searchParams.get('action');

    switch (action) {
      case 'map-rule':
        if (!ruleId) {
          return NextResponse.json({ error: 'ruleId is required for mapping' }, { status: 400 });
        }
        const mapping = await mitreMapper.mapRuleToMITRE({ id: ruleId });
        return NextResponse.json({ mapping });

      case 'cost-benefit':
        if (!ruleId) {
          return NextResponse.json({ error: 'ruleId is required for cost-benefit analysis' }, { status: 400 });
        }
        const analysis = await mitreMapper.calculateCostBenefit(ruleId);
        return NextResponse.json({ analysis });

      case 'coverage':
        const coverage = await mitreMapper.getTechniqueCoverage();
        return NextResponse.json({ coverage });

      case 'breach-analysis':
        if (!techniques || techniques.length === 0) {
          return NextResponse.json({ error: 'techniques are required for breach analysis' }, { status: 400 });
        }
        const breachAnalysis = await mitreMapper.getBreachAnalysis(techniques);
        return NextResponse.json({ breachAnalysis });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('MITRE ATT&CK API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, rule } = body;

    switch (action) {
      case 'map-rule':
        if (!rule) {
          return NextResponse.json({ error: 'rule is required' }, { status: 400 });
        }
        const mapping = await mitreMapper.mapRuleToMITRE(rule);
        return NextResponse.json({ mapping });

      case 'initialize':
        await mitreMapper.initializeData();
        return NextResponse.json({ message: 'MITRE data initialized successfully' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('MITRE ATT&CK API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 