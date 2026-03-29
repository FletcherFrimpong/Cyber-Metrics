// EDR Data Service
// Single source of truth for all alert data in the platform.
// Connects to Microsoft Sentinel to pull resolved incidents.
// All consumers (cost-calculations, dashboard, trends) go through this service.

import type { SecurityAlert, CategorizedAlerts } from "@/types/alerts";
import type { EDRQueryParams } from "./edr-api-client";

export type { CategorizedAlerts } from "@/types/alerts";

type AlertCategory = "edr" | "email" | "network" | "web" | "cloud";

class EDRDataService {
  private poller: any = null; // SentinelPoller — lazily imported
  private sentinelConnected = false;

  // Sentinel alert store — ingested alerts keyed by category
  private sentinelAlerts: Record<AlertCategory, SecurityAlert[]> = {
    edr: [], email: [], network: [], web: [], cloud: [],
  };
  private sentinelAlertCount = 0;
  private lastIngestTime: string | null = null;

  // Cache for getAlerts() queries
  private cache: Map<string, { data: SecurityAlert[]; timestamp: number }> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeSentinel();
  }

  // ─── SENTINEL INITIALIZATION ───────────────────────────────────────────────

  private async initializeSentinel(): Promise<void> {
    // Check env vars directly — avoid importing config module at top level
    if (!process.env.SENTINEL_TENANT_ID || !process.env.SENTINEL_CLIENT_ID || !process.env.SENTINEL_CLIENT_SECRET) {
      console.log("No Sentinel configured. Connect your SIEM to start ingesting alerts.");
      return;
    }

    // Lazy import — only load when Sentinel is actually configured
    const { getSentinelConfig } = await import("./sentinel-config");
    const { SentinelPoller } = await import("./sentinel-poller");

    const config = getSentinelConfig();
    if (!config) return;

    console.log("Sentinel configured — starting poller");
    this.sentinelConnected = true;

    this.poller = new SentinelPoller(config, (alerts, category) => {
      this.ingestAlerts(alerts as SecurityAlert[], category);
    });

    this.poller.start();
  }

  // ─── ALERT INGESTION (from poller or webhook) ──────────────────────────────

  ingestAlerts(alerts: SecurityAlert[], category: AlertCategory): void {
    // Deduplicate by alert ID
    const existingIds = new Set(this.sentinelAlerts[category].map(a => a.id));
    const newAlerts = alerts.filter(a => !existingIds.has(a.id));

    if (newAlerts.length > 0) {
      this.sentinelAlerts[category].push(...newAlerts);
      this.sentinelAlertCount += newAlerts.length;
      this.lastIngestTime = new Date().toISOString();
      // Invalidate cache since we have new data
      this.cache.clear();
    }
  }

  // ─── PRIMARY DATA ACCESS ───────────────────────────────────────────────────
  // This is what cost-calculations and all components should call.

  getTimeframeAlerts(timeframe: string): CategorizedAlerts {
    if (this.sentinelAlertCount > 0) {
      return this.getSentinelAlertsForTimeframe(timeframe);
    }

    // No data ingested yet — return empty categories
    return { edr: [], email: [], network: [], web: [], cloud: [] };
  }

  // Filter Sentinel alerts by timeframe
  private getSentinelAlertsForTimeframe(timeframe: string): CategorizedAlerts {
    const { startTime, endTime } = this.parseTimeframe(timeframe);
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    const filter = (alerts: SecurityAlert[]) =>
      alerts.filter(a => {
        const t = new Date(a.timestamp).getTime();
        return t >= start && t <= end;
      });

    return {
      edr: filter(this.sentinelAlerts.edr),
      email: filter(this.sentinelAlerts.email),
      network: filter(this.sentinelAlerts.network),
      web: filter(this.sentinelAlerts.web),
      cloud: filter(this.sentinelAlerts.cloud),
    };
  }

  // ─── FLAT ALERT ACCESS (for backward compat with EDRQueryParams) ───────────

  async getAlerts(params: EDRQueryParams = {}): Promise<SecurityAlert[]> {
    const cacheKey = JSON.stringify(params);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }

    // Flatten all categories
    let all: SecurityAlert[] = Object.values(this.sentinelAlerts).flat();

    // Apply filters
    if (params.startTime || params.endTime) {
      all = all.filter(a => {
        const t = new Date(a.timestamp).getTime();
        if (params.startTime && t < new Date(params.startTime).getTime()) return false;
        if (params.endTime && t > new Date(params.endTime).getTime()) return false;
        return true;
      });
    }
    if (params.severity?.length) {
      all = all.filter(a => params.severity!.includes(a.severity));
    }
    if (params.category?.length) {
      all = all.filter(a => params.category!.includes(a.category));
    }
    if (params.offset) all = all.slice(params.offset);
    if (params.limit) all = all.slice(0, params.limit);

    this.cache.set(cacheKey, { data: all, timestamp: Date.now() });
    return all;
  }

  // ─── SENTINEL CONTROL ─────────────────────────────────────────────────────

  // Connect to Sentinel at runtime (called from settings API when user saves creds)
  async connectSentinel(config: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    pollingIntervalMs?: number;
    [key: string]: any;
  }): Promise<void> {
    // Stop existing poller if any
    if (this.poller) {
      this.poller.stop();
      this.poller = null;
    }

    if (!config.tenantId || !config.clientId || !config.clientSecret) {
      this.sentinelConnected = false;
      console.log("Sentinel disconnected — missing credentials");
      return;
    }

    const { SentinelPoller } = await import("./sentinel-poller");

    const sentinelConfig = {
      tenantId: config.tenantId,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      pollingIntervalMs: config.pollingIntervalMs || 900000,
      workspaceId: config.workspaceId,
      resourceGroup: config.resourceGroup,
      workspaceName: config.workspaceName,
      subscriptionId: config.subscriptionId,
    };

    this.poller = new SentinelPoller(sentinelConfig, (alerts, category) => {
      this.ingestAlerts(alerts as SecurityAlert[], category);
    });

    this.sentinelConnected = true;
    this.poller.start();
    console.log("Sentinel connected — poller started");
  }

  async syncSentinel(since?: string, fullResync?: boolean) {
    if (!this.poller) throw new Error("Sentinel not configured");
    if (fullResync) {
      // Clear existing data for a fresh start
      this.sentinelAlerts = { edr: [], email: [], network: [], web: [], cloud: [] };
      this.sentinelAlertCount = 0;
    }
    return this.poller.syncNow(since, fullResync);
  }

  getSentinelStatus() {
    if (!this.poller) {
      return {
        connected: false,
        isPolling: false,
        lastPollTime: null as string | null,
        totalFetched: 0,
        categoryBreakdown: { edr: 0, email: 0, network: 0, web: 0, cloud: 0 },
        recentErrors: [] as string[],
      };
    }

    const pollerStatus = this.poller.getStatus();
    return {
      connected: this.sentinelConnected,
      isPolling: pollerStatus.isPolling,
      lastPollTime: pollerStatus.lastPollTime,
      totalFetched: pollerStatus.totalFetched,
      categoryBreakdown: {
        edr: this.sentinelAlerts.edr.length,
        email: this.sentinelAlerts.email.length,
        network: this.sentinelAlerts.network.length,
        web: this.sentinelAlerts.web.length,
        cloud: this.sentinelAlerts.cloud.length,
      },
      recentErrors: pollerStatus.recentErrors,
    };
  }

  // ─── DEPARTMENT AGGREGATION ──────────────────────────────────────────────────
  // Aggregates alerts by department for the "Top Affected Units" view.

  getDepartmentBreakdown(timeframe: string): { name: string; alerts: number; costImpact: number; critical: number; high: number }[] {
    const data = this.getTimeframeAlerts(timeframe);
    const allAlerts = [...data.edr, ...data.email, ...data.network, ...data.web, ...data.cloud];

    const deptMap = new Map<string, { alerts: number; costImpact: number; critical: number; high: number }>();

    for (const alert of allAlerts) {
      const dept = (alert as any).department || "Unattributed";
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { alerts: 0, costImpact: 0, critical: 0, high: 0 });
      }
      const entry = deptMap.get(dept)!;
      entry.alerts++;
      entry.costImpact += alert.costImpact || 0;
      if (alert.severity === "Critical") entry.critical++;
      if (alert.severity === "High") entry.high++;
    }

    return Array.from(deptMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.costImpact - a.costImpact);
  }

  // ─── GENERAL STATUS ────────────────────────────────────────────────────────

  getStatus() {
    return {
      hasAPIClient: this.sentinelConnected,
      useRealData: this.sentinelConnected,
      fallbackToSampleData: false,
      cacheSize: this.cache.size,
      sentinelAlertCount: this.sentinelAlertCount,
      lastIngestTime: this.lastIngestTime,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  private parseTimeframe(timeframe: string): { startTime: string; endTime: string } {
    const yearMatch = timeframe.match(/(\d{4})/);
    const quarterMatch = timeframe.match(/Q(\d)/);

    if (yearMatch && quarterMatch) {
      const year = parseInt(yearMatch[1] || "2024");
      const quarter = parseInt(quarterMatch[1] || "1");
      const startMonth = (quarter - 1) * 3;
      const endMonth = startMonth + 2;
      return {
        startTime: new Date(year, startMonth, 1).toISOString(),
        endTime: new Date(year, endMonth + 1, 0, 23, 59, 59).toISOString(),
      };
    }

    // Default to current quarter
    const now = new Date();
    const cq = Math.floor(now.getMonth() / 3) + 1;
    const cy = now.getFullYear();
    const sm = (cq - 1) * 3;
    return {
      startTime: new Date(cy, sm, 1).toISOString(),
      endTime: new Date(cy, sm + 3, 0, 23, 59, 59).toISOString(),
    };
  }
}

// Singleton
const edrDataService = new EDRDataService();
export default edrDataService;
