// Sentinel Polling Service
// Periodically pulls resolved incidents from Sentinel and feeds them
// into the data service. Uses a high-water mark to avoid re-fetching.

import { SentinelClient } from "./sentinel-client";
import type { SentinelConfig } from "./sentinel-config";
import type { AzureSentinelAlert } from "@/types/alerts";
import { transformIncident, type AlertCategory } from "./sentinel-category-mapper";

export interface PollResult {
  fetchedIncidents: number;
  newAlerts: number;
  categories: Record<AlertCategory, number>;
  timestamp: string;
}

export class SentinelPoller {
  private client: SentinelClient;
  private intervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private isPolling = false;

  // High-water mark: last successful poll timestamp
  private lastPollTime: string | null = null;

  // Callback: delivers new alerts to the data service
  private onAlerts: (alerts: AzureSentinelAlert[], category: AlertCategory) => void;

  // Stats
  private totalFetched = 0;
  private lastResult: PollResult | null = null;
  private errors: string[] = [];

  constructor(
    config: SentinelConfig,
    onAlerts: (alerts: AzureSentinelAlert[], category: AlertCategory) => void
  ) {
    this.client = new SentinelClient(config);
    this.intervalMs = config.pollingIntervalMs;
    this.onAlerts = onAlerts;
  }

  // Start polling
  start(): void {
    if (this.timer) return; // Already running

    console.log(`Sentinel Poller: Starting (interval: ${this.intervalMs / 1000}s)`);

    // Do an initial poll immediately
    this.poll();

    // Then set up the interval
    this.timer = setInterval(() => this.poll(), this.intervalMs);
  }

  // Stop polling
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log("Sentinel Poller: Stopped");
    }
  }

  // Manual trigger (for /api/sentinel/sync)
  async syncNow(since?: string, fullResync?: boolean): Promise<PollResult> {
    const effectiveSince = fullResync ? undefined : (since || this.lastPollTime || undefined);
    return this.doPoll(effectiveSince);
  }

  // Health check passthrough
  async healthCheck() {
    return this.client.healthCheck();
  }

  // Get status
  getStatus() {
    return {
      isRunning: this.timer !== null,
      isPolling: this.isPolling,
      lastPollTime: this.lastPollTime,
      totalFetched: this.totalFetched,
      lastResult: this.lastResult,
      recentErrors: this.errors.slice(-5),
    };
  }

  // Internal: scheduled poll
  private async poll(): Promise<void> {
    if (this.isPolling) return; // Skip if previous poll still running

    try {
      // First poll: get last 90 days. Subsequent: incremental.
      const since = this.lastPollTime || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      await this.doPoll(since);
    } catch (err: any) {
      const msg = `Poll failed: ${err.message}`;
      console.error("Sentinel Poller:", msg);
      this.errors.push(`${new Date().toISOString()} - ${msg}`);
      if (this.errors.length > 20) this.errors.shift();
    }
  }

  // Core poll logic
  private async doPoll(since?: string): Promise<PollResult> {
    this.isPolling = true;
    const categories: Record<AlertCategory, number> = { edr: 0, email: 0, network: 0, web: 0, cloud: 0 };
    let newAlerts = 0;

    try {
      const incidents = await this.client.getResolvedIncidentsWithAlerts(since);

      for (const incident of incidents) {
        const grouped = transformIncident(incident);
        for (const { category, alerts } of grouped) {
          this.onAlerts(alerts, category);
          categories[category] += alerts.length;
          newAlerts += alerts.length;
        }
      }

      this.lastPollTime = new Date().toISOString();
      this.totalFetched += incidents.length;

      const result: PollResult = {
        fetchedIncidents: incidents.length,
        newAlerts,
        categories,
        timestamp: this.lastPollTime,
      };
      this.lastResult = result;

      if (incidents.length > 0) {
        console.log(`Sentinel Poller: Fetched ${incidents.length} incidents → ${newAlerts} alerts`);
      }

      return result;
    } finally {
      this.isPolling = false;
    }
  }
}
