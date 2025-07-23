import { NextRequest, NextResponse } from 'next/server';
import { fetchSentinelAlerts, getSentinelAlertAnalytics, SentinelAlert } from '@/lib/sentinel-alerts';

export async function GET(request: NextRequest) {
  try {
    console.log('Alerts API endpoint called - fetching real Microsoft Sentinel alerts');
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const alertId = searchParams.get('alertId');
    const severity = searchParams.get('severity');
    const category = searchParams.get('category');
    const tactic = searchParams.get('tactic');
    const technique = searchParams.get('technique');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log(`Action: ${action}, AlertId: ${alertId}, Severity: ${severity}, Category: ${category}`);

    // Fetch real alerts from Microsoft Sentinel GitHub repository
    const realAlerts = await fetchSentinelAlerts();

    switch (action) {
      case 'get':
        if (!alertId) {
          return NextResponse.json({ error: 'Alert ID is required for get action' }, { status: 400 });
        }
        
        const alert = realAlerts.find(a => a.alertId === alertId);
        if (!alert) {
          return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
        }
        
        return NextResponse.json({
          success: true,
          alert,
          source: 'Microsoft Sentinel GitHub Repository',
          lastUpdated: new Date().toISOString()
        });

      case 'analytics':
        const analytics = getSentinelAlertAnalytics(realAlerts);
        
        return NextResponse.json({
          success: true,
          analytics,
          source: 'Microsoft Sentinel GitHub Repository',
          lastUpdated: new Date().toISOString()
        });

      case 'list':
      default:
        // Apply filters
        let filteredAlerts = [...realAlerts];

        if (severity && severity !== 'all') {
          filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
        }

        if (category && category !== 'all') {
          filteredAlerts = filteredAlerts.filter(alert => alert.category === category);
        }

        if (tactic && tactic !== 'all') {
          filteredAlerts = filteredAlerts.filter(alert => alert.tactics.includes(tactic));
        }

        if (technique && technique !== 'all') {
          filteredAlerts = filteredAlerts.filter(alert => alert.relevantTechniques.includes(technique));
        }

        // Apply limit
        filteredAlerts = filteredAlerts.slice(0, limit);

        return NextResponse.json({
          success: true,
          alerts: filteredAlerts,
          totalCount: filteredAlerts.length,
          source: 'Microsoft Sentinel GitHub Repository',
          lastUpdated: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error in alerts API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch alerts from Microsoft Sentinel GitHub repository',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    console.log('Alerts API POST called:', { action });

    // Fetch real alerts from Microsoft Sentinel GitHub repository
    const realAlerts = await fetchSentinelAlerts();

    switch (action) {
      case 'refresh':
        return NextResponse.json({
          success: true,
          message: 'Alerts refreshed successfully from Microsoft Sentinel GitHub repository',
          totalAlerts: realAlerts.length,
          lastUpdated: new Date().toISOString()
        });

      case 'search':
        const { filters } = body;
        let searchResults = [...realAlerts];
        
        if (filters?.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase();
          searchResults = searchResults.filter(alert => 
            alert.name.toLowerCase().includes(searchTerm) ||
            alert.description.toLowerCase().includes(searchTerm)
          );
        }

        if (filters?.severity) {
          searchResults = searchResults.filter(alert => alert.severity === filters.severity);
        }

        if (filters?.category) {
          searchResults = searchResults.filter(alert => alert.category === filters.category);
        }

        if (filters?.tactics && filters.tactics.length > 0) {
          searchResults = searchResults.filter(alert => 
            filters.tactics.some((tactic: string) => alert.tactics.includes(tactic))
          );
        }

        if (filters?.techniques && filters.techniques.length > 0) {
          searchResults = searchResults.filter(alert => 
            filters.techniques.some((technique: string) => alert.relevantTechniques.includes(technique))
          );
        }

        return NextResponse.json({
          success: true,
          results: searchResults,
          totalResults: searchResults.length,
          source: 'Microsoft Sentinel GitHub Repository',
          lastUpdated: new Date().toISOString()
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in alerts API POST:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request from Microsoft Sentinel GitHub repository',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 