// POST /api/sentinel/sync
// Triggers a manual sync from Sentinel. Useful for testing or on-demand refresh.

import { NextRequest, NextResponse } from "next/server";
import { isSentinelConfigured } from "@/lib/sentinel-config";

async function getDataService() {
  const mod = await import("@/lib/edr-data-service");
  return mod.default;
}

export async function POST(request: NextRequest) {
  try {
    if (!isSentinelConfigured()) {
      return NextResponse.json({ error: "Sentinel not configured" }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const { since, fullResync } = body as { since?: string; fullResync?: boolean };

    const dataService = await getDataService();
    const result = await dataService.syncSentinel(since, fullResync);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Sentinel sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
