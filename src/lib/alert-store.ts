// Durable alert storage (server-side only).
// A single SQLite file under .data/ using Node's built-in driver, so there is
// no extra dependency and nothing to run. Holds real alerts from Sentinel and
// the connectors, plus each source's last successful poll time. Demonstration
// data is never written here.

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { SecurityAlert } from "../types/alerts";

export type StoredCategory = "edr" | "email" | "network" | "web" | "cloud";

export interface StoredAlert {
  category: StoredCategory;
  alert: SecurityAlert;
}

const SCHEMA_VERSION = 1;

export class AlertStore {
  private db: DatabaseSync;

  constructor(path: string = defaultDbPath()) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS alerts (
        id         TEXT PRIMARY KEY,
        category   TEXT NOT NULL,
        timestamp  TEXT NOT NULL,
        data       TEXT NOT NULL,
        stored_at  TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS alerts_timestamp ON alerts (timestamp);
      CREATE TABLE IF NOT EXISTS source_state (
        source  TEXT PRIMARY KEY,
        value   TEXT NOT NULL
      );
    `);
    this.db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }

  /** Insert alerts, replacing any with the same id so a changed verdict is picked up. */
  upsert(alerts: SecurityAlert[], category: StoredCategory): void {
    if (alerts.length === 0) return;
    const stmt = this.db.prepare(
      `INSERT INTO alerts (id, category, timestamp, data, stored_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET category = excluded.category, timestamp = excluded.timestamp,
                                     data = excluded.data, stored_at = excluded.stored_at`
    );
    const now = new Date().toISOString();
    this.db.exec("BEGIN");
    try {
      for (const alert of alerts) {
        stmt.run(alert.id, category, alert.timestamp, JSON.stringify(alert), now);
      }
      this.db.exec("COMMIT");
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  loadAll(): StoredAlert[] {
    const rows = this.db.prepare("SELECT category, data FROM alerts ORDER BY timestamp").all() as { category: string; data: string }[];
    const out: StoredAlert[] = [];
    for (const row of rows) {
      try {
        out.push({ category: row.category as StoredCategory, alert: JSON.parse(row.data) });
      } catch {
        // skip a row that cannot be parsed rather than fail the whole load
      }
    }
    return out;
  }

  count(): number {
    return Number((this.db.prepare("SELECT COUNT(*) AS n FROM alerts").get() as { n: number }).n);
  }

  /** Delete every alert whose id starts with the prefix (one source). Returns rows removed. */
  deleteByPrefix(prefix: string): number {
    const escaped = prefix.replace(/[\\%_]/g, (c) => `\\${c}`);
    const result = this.db.prepare("DELETE FROM alerts WHERE id LIKE ? ESCAPE '\\'").run(`${escaped}%`);
    return Number(result.changes);
  }

  getState(source: string): string | null {
    const row = this.db.prepare("SELECT value FROM source_state WHERE source = ?").get(source) as { value: string } | undefined;
    return row?.value ?? null;
  }

  setState(source: string, value: string | null): void {
    if (value === null) {
      this.db.prepare("DELETE FROM source_state WHERE source = ?").run(source);
    } else {
      this.db
        .prepare("INSERT INTO source_state (source, value) VALUES (?, ?) ON CONFLICT(source) DO UPDATE SET value = excluded.value")
        .run(source, value);
    }
  }

  close(): void {
    this.db.close();
  }
}

function defaultDbPath(): string {
  return process.env.SF_DB_PATH || join(process.cwd(), ".data", "signalfoundry.db");
}

// One store per process.
const g = globalThis as any;
export function getAlertStore(): AlertStore {
  if (!g.__sfAlertStore) g.__sfAlertStore = new AlertStore();
  return g.__sfAlertStore as AlertStore;
}
