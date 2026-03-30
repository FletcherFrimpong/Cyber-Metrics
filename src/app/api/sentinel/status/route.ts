// GET /api/sentinel/status
// Returns Sentinel connection status. Tries to get live stats from the data
// service but falls back to a lightweight check if it isn't loaded yet.

import { NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";

export async function GET() {
  const auth = await requireAuth("settings:view");
  if (isAuthError(auth)) return auth;
  // Check if Sentinel creds exist in the settings store (globalThis)
  const g = globalThis as any;
  const settings = g.__sfSettings || {};
  const sentinel = settings.sentinel;
  const configured = !!(sentinel?.tenantId && sentinel?.clientId && sentinel?.clientSecret);

  // Try to get live ingestion stats from the data service (lazy import so it
  // won't pull in heavy modules if the service hasn't been initialised yet)
  let liveStatus: any = null;
  try {
    const mod = await import("@/lib/edr-data-service");
    const svc = mod.default;
    if (svc && typeof svc.getSentinelStatus === "function") {
      liveStatus = svc.getSentinelStatus();
    }
  } catch {
    // Data service not available — fall through to basic response
  }

  return NextResponse.json({
    configured,
    connected: liveStatus?.connected ?? configured,
    tenantId: sentinel?.tenantId ? "••••" + sentinel.tenantId.slice(-4) : null,
    pollingIntervalMs: sentinel?.pollingIntervalMs || 900000,
    isPolling: liveStatus?.isPolling ?? false,
    lastPollTime: liveStatus?.lastPollTime ?? null,
    totalFetched: liveStatus?.totalFetched ?? 0,
    categoryBreakdown: liveStatus?.categoryBreakdown ?? null,
    recentErrors: liveStatus?.recentErrors ?? [],
    timestamp: new Date().toISOString(),
  });
}
