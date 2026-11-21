// EDR Data Service
// Single source of truth for all alert data in the platform.
// Holds alerts delivered by the connectors (src/lib/connectors) and the stored history.
// All consumers (cost-calculations, dashboard, trends) go through this service.

import type { SecurityAlert, CategorizedAlerts, EDRQueryParams } from "@/types/alerts";
import { getAlertStore, type AlertStore } from "./alert-store";

export type { CategorizedAlerts } from "@/types/alerts";

import { ALERT_CATEGORIES, emptyByCategory, type AlertCategory } from "./connectors/types";

class EDRDataService {
  // True once a data source (connector) has been configured
  private realSourceConnected = false;

  // Sentinel alert store — ingested alerts keyed by category
  private sentinelAlerts: Record<AlertCategory, SecurityAlert[]> = emptyByCategory<SecurityAlert>();
  private sentinelAlertCount = 0;
  private lastIngestTime: string | null = null;

  // Sample data — loaded once, used as fallback until real data arrives
  private usingSampleData = false;
  private sampleDataLoaded = false;

  // Cache for getAlerts() queries
  private cache: Map<string, { data: SecurityAlert[]; timestamp: number }> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  // Durable copy of every real alert; null if the database cannot be opened.
  private store: AlertStore | null = null;

  constructor() {
    this.loadPersistedAlerts();
    // Nothing stored: show demonstration data until a source is connected
    if (this.sentinelAlertCount === 0) this.loadSampleData();
  }

  // ─── PERSISTENCE ───────────────────────────────────────────────────────────
  // Real alerts are written to .data/signalfoundry.db as they arrive and read
  // back here on startup, so a restart keeps the history.

  private loadPersistedAlerts(): void {
    try {
      this.store = getAlertStore();
      const rows = this.store.loadAll();
      for (const { category, alert } of rows) {
        if (this.sentinelAlerts[category]) this.sentinelAlerts[category].push(alert);
      }
      this.sentinelAlertCount = rows.length;
      if (rows.length > 0) {
        this.sampleDataLoaded = true; // real history exists: never mix in demo data
        this.lastIngestTime = new Date().toISOString();
        console.log(`Loaded ${rows.length} stored alerts from disk`);
      }
    } catch (err: any) {
      this.store = null;
      console.error("Alert storage unavailable; alerts will be kept in memory only:", err?.message || err);
    }
  }

  private persist(action: (store: AlertStore) => void): void {
    if (!this.store) return;
    try {
      action(this.store);
    } catch (err: any) {
      console.error("Failed to write to alert storage:", err?.message || err);
    }
  }

  /** Last successful poll time for a source, kept across restarts. */
  getSourceState(source: string): string | null {
    try {
      return this.store?.getState(source) ?? null;
    } catch {
      return null;
    }
  }

  setSourceState(source: string, value: string | null): void {
    this.persist((store) => store.setState(source, value));
  }

  // ─── SAMPLE DATA FALLBACK ──────────────────────────────────────────────────
  // Loads demonstration data so the dashboard isn't empty before Sentinel connects.
  // Automatically replaced by real data when a connector is configured.

  private loadSampleData(): void {
    if (this.sampleDataLoaded) return;

    try {
      // Loaded on demand so demo data stays out of the way once real data exists
      const { generateDemoAlerts } = require("@/data/demo-alerts");

      // Demo alerts for the current and previous three quarters
      const now = new Date();
      const currentQ = Math.floor(now.getMonth() / 3) + 1;
      const currentY = now.getFullYear();

      for (let i = 3; i >= 0; i--) {
        let q = currentQ - i;
        let y = currentY;
        if (q <= 0) { q += 4; y -= 1; }

        for (const { alert, category } of generateDemoAlerts(`Q${q} ${y}`)) {
          // Nothing dated in the future: the current quarter is only part-way through
          if (new Date(alert.timestamp) > now) continue;
          this.sentinelAlerts[category as AlertCategory].push(alert as SecurityAlert);
        }
      }

      this.sentinelAlertCount = Object.values(this.sentinelAlerts).reduce((sum, arr) => sum + arr.length, 0);
      this.usingSampleData = true;
      this.sampleDataLoaded = true;
      this.lastIngestTime = new Date().toISOString();
      console.log(`Sample data loaded: ${this.sentinelAlertCount} alerts across 4 quarters`);
    } catch (err) {
      console.warn("Failed to load sample data:", err);
    }
  }

  // Clears sample data when real data source connects
  private clearSampleData(): void {
    if (!this.usingSampleData) return;
    this.sentinelAlerts = emptyByCategory<SecurityAlert>();
    this.sentinelAlertCount = 0;
    this.usingSampleData = false;
    this.cache.clear();
    console.log("Sample data cleared — switching to real Sentinel data");
  }

  // ─── ALERT INGESTION (from connectors or the webhook) ──────────────────────────────

  /** Called when a real data source connects: drops the demonstration data. */
  useRealData(): void {
    this.realSourceConnected = true;
    this.clearSampleData();
  }

  /** Drop every alert from one source, e.g. when its connector is disconnected. */
  removeBySourcePrefix(prefix: string): void {
    for (const key of Object.keys(this.sentinelAlerts) as AlertCategory[]) {
      this.sentinelAlerts[key] = this.sentinelAlerts[key].filter(a => !a.id.startsWith(prefix));
    }
    this.sentinelAlertCount = Object.values(this.sentinelAlerts).reduce((sum, arr) => sum + arr.length, 0);
    this.cache.clear();
    this.persist((store) => store.deleteByPrefix(prefix));
  }

  /** With no data source left, show the demonstration data again. */
  restoreSampleData(): void {
    this.realSourceConnected = false;
    if (this.usingSampleData) return;
    if (this.sentinelAlertCount > 0) return; // real history from another source is still held
    this.sampleDataLoaded = false;
    this.cache.clear();
    this.loadSampleData();
  }

  /** Alerts held from one source (matched on the alert id prefix). */
  countBySourcePrefix(prefix: string): number {
    return Object.values(this.sentinelAlerts).reduce(
      (sum, list) => sum + list.filter(a => a.id.startsWith(prefix)).length, 0);
  }

  ingestAlerts(alerts: SecurityAlert[], category: AlertCategory): void {
    if (alerts.length === 0) return;
    this.clearSampleData();

    // Upsert by alert ID: a re-fetched alert replaces the stored one, so a
    // verdict or severity changed in the source system is picked up. An alert
    // that moved category is removed from its old one.
    const incoming = new Map(alerts.map(a => [a.id, a]));
    for (const key of Object.keys(this.sentinelAlerts) as AlertCategory[]) {
      this.sentinelAlerts[key] = this.sentinelAlerts[key].filter(a => !incoming.has(a.id));
    }
    this.sentinelAlerts[category].push(...incoming.values());
    this.sentinelAlertCount = Object.values(this.sentinelAlerts).reduce((sum, arr) => sum + arr.length, 0);
    this.lastIngestTime = new Date().toISOString();
    this.cache.clear();

    this.persist((store) => store.upsert([...incoming.values()], category));
  }

  // ─── PRIMARY DATA ACCESS ───────────────────────────────────────────────────
  // This is what cost-calculations and all components should call.

  getTimeframeAlerts(timeframe: string): CategorizedAlerts {
    if (this.sentinelAlertCount > 0) {
      return this.getSentinelAlertsForTimeframe(timeframe);
    }

    // No data at all — try loading sample data as fallback
    if (!this.sampleDataLoaded) {
      this.loadSampleData();
      if (this.sentinelAlertCount > 0) {
        return this.getSentinelAlertsForTimeframe(timeframe);
      }
    }

    return emptyByCategory<SecurityAlert>();
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

    const out = emptyByCategory<SecurityAlert>();
    for (const c of ALERT_CATEGORIES) out[c] = filter(this.sentinelAlerts[c]);
    return out;
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

  // ─── DEPARTMENT AGGREGATION ──────────────────────────────────────────────────
  // Aggregates alerts by department for the "Top Affected Units" view.

  getDepartmentBreakdown(timeframe: string): { name: string; alerts: number; costImpact: number; critical: number; high: number }[] {
    const data = this.getTimeframeAlerts(timeframe);
    const allAlerts = ALERT_CATEGORIES.flatMap(c => data[c]);

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
      hasAPIClient: this.realSourceConnected,
      useRealData: this.realSourceConnected && !this.usingSampleData,
      usingSampleData: this.usingSampleData,
      cacheSize: this.cache.size,
      sentinelAlertCount: this.sentinelAlertCount,
      lastIngestTime: this.lastIngestTime,
      persistent: this.store !== null,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  private parseTimeframe(timeframe: string): { startTime: string; endTime: string } {
    // Use UTC dates to avoid timezone drift with Sentinel data (which is always UTC)
    const makeQuarterRange = (year: number, quarter: number) => {
      const startMonth = (quarter - 1) * 3; // 0-indexed: Q1=0, Q2=3, Q3=6, Q4=9
      const endMonth = startMonth + 3;       // exclusive: Q1 ends at month 3 (April 1)
      return {
        startTime: new Date(Date.UTC(year, startMonth, 1)).toISOString(),
        endTime: new Date(Date.UTC(year, endMonth, 0, 23, 59, 59, 999)).toISOString(),
      };
    };

    if (timeframe) {
      const yearMatch = timeframe.match(/(\d{4})/);
      const quarterMatch = timeframe.match(/Q(\d)/);

      if (yearMatch && quarterMatch) {
        const year = parseInt(yearMatch[1]);
        const quarter = parseInt(quarterMatch[1]);
        return makeQuarterRange(year, quarter);
      }
    }

    // Default to current quarter (UTC)
    const now = new Date();
    const cq = Math.floor(now.getUTCMonth() / 3) + 1;
    return makeQuarterRange(now.getUTCFullYear(), cq);
  }
}

// Lazy singleton via globalThis — avoids blocking module resolution
const g = globalThis as any;
function getDataService(): EDRDataService {
  if (!g.__edrDataService) {
    g.__edrDataService = new EDRDataService();
  }
  return g.__edrDataService;
}

// Proxy that lazily initializes on first property access
const edrDataService = new Proxy({} as EDRDataService, {
  get(_target, prop) {
    const svc = getDataService();
    const val = (svc as any)[prop];
    return typeof val === "function" ? val.bind(svc) : val;
  },
});

export default edrDataService;
