import { NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";
import { getSettings } from "@/lib/settings-store";
import { CONNECTORS, getConnectorManager, isConfigured, startSavedConnectors } from "@/lib/connectors/runtime";
import edrDataService from "@/lib/edr-data-service";

// GET /api/data-status
// Where the dashboard's data is coming from right now, for the status banner:
// demo data, a first sync in progress, a failing connection, or live sources.
export async function GET() {
  const auth = await requireAuth("dashboard:view");
  if (isAuthError(auth)) return auth;
  startSavedConnectors();

  const saved = getSettings().connectors || {};
  const manager = getConnectorManager();
  const sources = CONNECTORS.filter((def) => manager.isRunning(def.id) || isConfigured(def, saved[def.id])).map((def) => {
    const status = manager.getStatus(def.id);
    const alertsHeld = edrDataService.countBySourcePrefix(def.idPrefix);
    // "syncing" only until the first pull has finished one way or the other
    const state = status?.lastError ? "error" : !status?.lastPollTime ? "syncing" : "ok";
    return {
      id: def.id,
      name: def.name,
      state,
      alertsHeld,
      lastPollTime: status?.lastPollTime ?? null,
      // drop the leading timestamp the manager adds
      error: status?.lastError ? status.lastError.replace(/^\S+\s/, "").slice(0, 220) : null,
    };
  });

  const data = edrDataService.getStatus();
  return NextResponse.json({
    success: true,
    usingSampleData: data.usingSampleData,
    alertsHeld: data.usingSampleData ? 0 : data.sentinelAlertCount,
    sources,
  });
}
