// Server-side wiring: one ConnectorManager per process, fed into the data service.

import { ConnectorManager } from "./manager";
import { CONNECTORS, getConnector } from "./registry";
import { getSettings } from "../settings-store";
import edrDataService from "../edr-data-service";
import type { ConnectorConfig, ConnectorDefinition } from "./types";

const g = globalThis as any;

export function getConnectorManager(): ConnectorManager {
  if (!g.__sfConnectorManager) {
    g.__sfConnectorManager = new ConnectorManager(
      (alerts, category) => {
        edrDataService.ingestAlerts(alerts, category);
      },
      {
        get: (id) => edrDataService.getSourceState(`connector:${id}`),
        set: (id, value) => edrDataService.setSourceState(`connector:${id}`, value),
      }
    );
  }
  return g.__sfConnectorManager as ConnectorManager;
}

export function isConfigured(def: ConnectorDefinition, config: ConnectorConfig | undefined | null): boolean {
  if (!config) return false;
  return def.fields.filter((f) => f.required).every((f) => !!config[f.key]);
}

/** Start every connector that has saved credentials. Safe to call repeatedly. */
export function startSavedConnectors(): void {
  if (g.__sfConnectorsStarted) return;
  g.__sfConnectorsStarted = true;
  const settings = getSettings();

  const saved: Record<string, ConnectorConfig> = { ...(settings.connectors || {}) };
  // Credentials supplied through the environment (the original SENTINEL_* names
  // are kept; they always addressed the Defender XDR API).
  const env = process.env;
  if (!saved.defender && env.SENTINEL_TENANT_ID && env.SENTINEL_CLIENT_ID && env.SENTINEL_CLIENT_SECRET) {
    saved.defender = { tenantId: env.SENTINEL_TENANT_ID, clientId: env.SENTINEL_CLIENT_ID, clientSecret: env.SENTINEL_CLIENT_SECRET };
  }
  const manager = getConnectorManager();
  for (const def of CONNECTORS) {
    if (isConfigured(def, saved[def.id])) {
      edrDataService.useRealData();
      manager.start(def, saved[def.id]);
    }
  }
}

export { CONNECTORS, getConnector };
