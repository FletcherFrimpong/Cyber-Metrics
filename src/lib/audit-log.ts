// Audit log (server-side only): who did what, and when.
// Kept in the same SQLite file as the alerts. Records sign-ins, team changes,
// settings changes and integration changes. Never records secrets.

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

export interface AuditEntry {
  id: number;
  at: string;
  actor: string;      // username, or "system" / "anonymous"
  actorRole: string;
  action: string;     // e.g. "user.invite", "settings.update"
  target: string;     // what it was done to
  detail: string;     // short human-readable note
}

export class AuditLog {
  private db: DatabaseSync;

  constructor(path: string = process.env.SF_DB_PATH || join(process.cwd(), ".data", "signalfoundry.db")) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        at          TEXT NOT NULL,
        actor       TEXT NOT NULL,
        actor_role  TEXT NOT NULL,
        action      TEXT NOT NULL,
        target      TEXT NOT NULL,
        detail      TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS audit_at ON audit_log (at);
    `);
  }

  record(entry: { actor?: string; actorRole?: string; action: string; target?: string; detail?: string }): void {
    this.db
      .prepare("INSERT INTO audit_log (at, actor, actor_role, action, target, detail) VALUES (?, ?, ?, ?, ?, ?)")
      .run(
        new Date().toISOString(),
        entry.actor || "system",
        entry.actorRole || "",
        entry.action,
        (entry.target || "").slice(0, 200),
        (entry.detail || "").slice(0, 400)
      );
  }

  list(limit = 100): AuditEntry[] {
    const rows = this.db
      .prepare("SELECT id, at, actor, actor_role AS actorRole, action, target, detail FROM audit_log ORDER BY id DESC LIMIT ?")
      .all(Math.min(Math.max(limit, 1), 500));
    return rows as unknown as AuditEntry[];
  }

  count(): number {
    return Number((this.db.prepare("SELECT COUNT(*) AS n FROM audit_log").get() as { n: number }).n);
  }

  close(): void {
    this.db.close();
  }
}

const g = globalThis as any;

/** Record an event. Never throws: a failed audit write must not break the action itself. */
export function audit(entry: { actor?: string; actorRole?: string; action: string; target?: string; detail?: string }): void {
  try {
    if (!g.__sfAuditLog) g.__sfAuditLog = new AuditLog();
    (g.__sfAuditLog as AuditLog).record(entry);
  } catch (err: any) {
    console.error("Audit log write failed:", err?.message || err);
  }
}

export function listAudit(limit?: number): AuditEntry[] {
  try {
    if (!g.__sfAuditLog) g.__sfAuditLog = new AuditLog();
    return (g.__sfAuditLog as AuditLog).list(limit);
  } catch {
    return [];
  }
}
