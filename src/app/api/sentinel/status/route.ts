// GET /api/sentinel/status
// Returns Sentinel connection status without importing heavy modules.

import { NextResponse } from "next/server";

export async function GET() {
  // Check if Sentinel creds exist in the settings store (globalThis)
  const g = globalThis as any;
  const settings = g.__sfSettings || {};
  const sentinel = settings.sentinel;
  const configured = !!(sentinel?.tenantId && sentinel?.clientId && sentinel?.clientSecret);

  return NextResponse.json({
    configured,
    connected: configured,
    tenantId: sentinel?.tenantId ? "••••" + sentinel.tenantId.slice(-4) : null,
    pollingIntervalMs: sentinel?.pollingIntervalMs || 900000,
    timestamp: new Date().toISOString(),
  });
}
