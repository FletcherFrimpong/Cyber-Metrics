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

  // Sentinel credentials saved in Settings are re-used after a restart.
  const sentinel = settings.sentinel;
  if (sentinel?.tenantId && sentinel.clientId && sentinel.clientSecret && !edrDataService.getSentinelStatus().connected) {
    void edrDataService.connectSentinel(sentinel).catch((err: any) => {
      console.error("Sentinel reconnect failed:", err?.message || err);
    });
  }

  const saved = settings.connectors || {};
  const manager = getConnectorManager();
  for (const def of CONNECTORS) {
    if (isConfigured(def, saved[def.id])) {
      edrDataService.useRealData();
      manager.start(def, saved[def.id]);
    }
  }
}

export { CONNECTORS, getConnector };
