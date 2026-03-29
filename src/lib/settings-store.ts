// Server-side settings store.
// In-memory with persistence via the Node.js process.
// Settings survive hot-reloads but reset on full server restart.
// In production, replace with database (pg is already a dependency).

export interface PlatformSettings {
  investmentAmount: number;
  sentinel: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    workspaceId?: string;
    resourceGroup?: string;
    workspaceName?: string;
    subscriptionId?: string;
    pollingIntervalMs: number;
    webhookSecret?: string;
  } | null;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  investmentAmount: 0,
  sentinel: null,
};

// Use globalThis to survive Next.js hot-reloads in dev mode
const globalStore = globalThis as any;
if (!globalStore.__signalFoundrySettings) {
  globalStore.__signalFoundrySettings = { ...DEFAULT_SETTINGS };
}

export function getSettings(): PlatformSettings {
  return globalStore.__signalFoundrySettings;
}

export function saveSettings(settings: Partial<PlatformSettings>): PlatformSettings {
  globalStore.__signalFoundrySettings = { ...globalStore.__signalFoundrySettings, ...settings };
  return globalStore.__signalFoundrySettings;
}

export function getClientSafeSettings(): any {
  const settings = getSettings();
  return {
    investmentAmount: settings.investmentAmount,
    sentinel: settings.sentinel
      ? {
          tenantId: settings.sentinel.tenantId,
          clientId: settings.sentinel.clientId,
          clientSecret: settings.sentinel.clientSecret ? "••••••••" : "",
          workspaceId: settings.sentinel.workspaceId || "",
          pollingIntervalMs: settings.sentinel.pollingIntervalMs,
          connected: !!(settings.sentinel.tenantId && settings.sentinel.clientId && settings.sentinel.clientSecret),
        }
      : null,
  };
}
