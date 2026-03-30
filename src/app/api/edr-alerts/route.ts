import { NextRequest, NextResponse } from 'next/server';
import edrDataService from '@/lib/edr-data-service';
import { requireAuth, isAuthError } from '@/lib/auth/api-guard';

export async function GET(request: NextRequest) {
  const auth = await requireAuth("alerts:view");
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const startTime = searchParams.get('startTime') || undefined;
    const endTime = searchParams.get('endTime') || undefined;
    const severity = searchParams.get('severity')?.split(',') || undefined;
    const category = searchParams.get('category')?.split(',') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    const timeframe = searchParams.get('timeframe') || undefined;

    let alerts;

    if (timeframe) {
      // Use timeframe-based query
      alerts = await edrDataService.getTimeframeAlerts(timeframe);
    } else {
      // Use parameter-based query - filter out undefined values
      const params: any = {};
      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;
      if (severity) params.severity = severity;
      if (category) params.category = category;
      if (limit) params.limit = limit;
      if (offset) params.offset = offset;
      
      alerts = await edrDataService.getAlerts(params);
    }

    // Get service status for debugging
    const status = edrDataService.getStatus();

    return NextResponse.json({
      success: true,
      data: alerts,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('EDR API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth("settings:edit");
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case 'clear-cache':
        edrDataService.clearCache();
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully'
        });

      case 'update-config':
        edrDataService.updateConfig(config);
        return NextResponse.json({
          success: true,
          message: 'Configuration updated successfully'
        });

      case 'get-status':
        const status = edrDataService.getStatus();
        return NextResponse.json({
          success: true,
          status
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('EDR API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
