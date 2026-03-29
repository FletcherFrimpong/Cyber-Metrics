// GET /api/sentinel/status
// Returns Sentinel connection health and ingestion stats.

import { NextResponse } from "next/server";
import { isSentinelConfigured } from "@/lib/sentinel-config";

async function getDataService() {
  const mod = await import("@/lib/edr-data-service");
  return mod.default;
}

export async function GET() {
  try {
    const configured = isSentinelConfigured();
    const dataService = await getDataService();
    const status = dataService.getStatus();
    const sentinelStatus = dataService.getSentinelStatus();

    return NextResponse.json({
      configured,
      connected: sentinelStatus.connected,
      lastPollTime: sentinelStatus.lastPollTime,
      isPolling: sentinelStatus.isPolling,
      totalFetched: sentinelStatus.totalFetched,
      categoryBreakdown: sentinelStatus.categoryBreakdown,
      recentErrors: sentinelStatus.recentErrors,
      dataSource: status.hasAPIClient ? "sentinel" : "sample",
      cacheSize: status.cacheSize,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
