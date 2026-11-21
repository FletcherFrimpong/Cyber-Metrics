// Runs configured connectors on a timer and feeds their alerts to the data service.

import type { ConnectorConfig, ConnectorDefinition, CategorizedAlert, AlertCategory } from "./types";
import type { SecurityAlert } from "../../types/alerts";

const POLL_INTERVAL_MS = 15 * 60 * 1000;
const FIRST_POLL_LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;

export interface ConnectorStatus {
  running: boolean;
  polling: boolean;
  lastPollTime: string | null;
  lastError: string | null;
  totalAlerts: number;
}

interface Runner {
  def: ConnectorDefinition;
  config: ConnectorConfig;
  timer: ReturnType<typeof setInterval> | null;
  status: ConnectorStatus;
}

type Sink = (alerts: SecurityAlert[], category: AlertCategory) => void;

/** Durable last-poll times, so a restart resumes where it left off. */
export interface PollStateStore {
  get(id: string): string | null;
  set(id: string, value: string | null): void;
}

export class ConnectorManager {
  private runners = new Map<string, Runner>();
  private sink: Sink;
  private state?: PollStateStore;

  constructor(sink: Sink, state?: PollStateStore) {
    this.sink = sink;
    this.state = state;
  }

  start(def: ConnectorDefinition, config: ConnectorConfig): void {
    this.stop(def.id);
    const runner: Runner = {
      def,
      config,
      timer: null,
      status: { running: true, polling: false, lastPollTime: this.state?.get(def.id) ?? null, lastError: null, totalAlerts: 0 },
    };
    this.runners.set(def.id, runner);
    void this.poll(runner);
    runner.timer = setInterval(() => void this.poll(runner), POLL_INTERVAL_MS);
  }

  stop(id: string): void {
    const runner = this.runners.get(id);
    if (runner?.timer) clearInterval(runner.timer);
    this.runners.delete(id);
  }

  /** Stop a connector and forget its poll position (used when it is disconnected). */
  forget(id: string): void {
    this.stop(id);
    this.state?.set(id, null);
  }

  getStatus(id: string): ConnectorStatus | null {
    return this.runners.get(id)?.status ?? null;
  }

  isRunning(id: string): boolean {
    return this.runners.has(id);
  }

  /** Poll now. Throws if the connector is not running or the poll fails. */
  async syncNow(id: string, fullResync = false): Promise<{ newAlerts: number }> {
    const runner = this.runners.get(id);
    if (!runner) throw new Error("Connector is not configured");
    if (fullResync) {
      runner.status.lastPollTime = null;
      this.state?.set(id, null);
    }
    const newAlerts = await this.poll(runner, true);
    return { newAlerts };
  }

  private async poll(runner: Runner, rethrow = false): Promise<number> {
    if (runner.status.polling) return 0;
    runner.status.polling = true;
    const startedAt = new Date().toISOString();
    try {
      const since = runner.status.lastPollTime || new Date(Date.now() - FIRST_POLL_LOOKBACK_MS).toISOString();
      const items: CategorizedAlert[] = await runner.def.fetchAlerts(runner.config, since);
      const byCategory = new Map<AlertCategory, SecurityAlert[]>();
      for (const item of items) {
        const list = byCategory.get(item.category);
        if (list) list.push(item.alert);
        else byCategory.set(item.category, [item.alert]);
      }
      for (const [category, alerts] of byCategory) this.sink(alerts, category);
      runner.status.lastPollTime = startedAt;
      this.state?.set(runner.def.id, startedAt);
      runner.status.lastError = null;
      runner.status.totalAlerts += items.length;
      if (items.length > 0) console.log(`Connector ${runner.def.id}: fetched ${items.length} alerts`);
      return items.length;
    } catch (err: any) {
      runner.status.lastError = `${new Date().toISOString()} ${err?.message || err}`;
      console.error(`Connector ${runner.def.id}: poll failed:`, err?.message || err);
      if (rethrow) throw err;
      return 0;
    } finally {
      runner.status.polling = false;
    }
  }
}
