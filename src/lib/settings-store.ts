// Persistent settings store backed by a local JSON file.
// Falls back to in-memory storage if file operations fail.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), ".data");
const SETTINGS_FILE = join(DATA_DIR, "settings.json");

export interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export interface AppSettings {
  investmentAmount: number;
  sentinel: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    workspaceId: string;
    pollingIntervalMs: number;
  } | null;
  smtp: SmtpSettings | null;
  /** Organisation profile the dollar figures are anchored to. See src/lib/anchor-data.ts. */
  organisation: {
    revenueBand: string | null;
    lossEventsLast12Months: number;
    typicalControlEffectiveness: number | null;
  } | null;
  /** Per-connector credentials, keyed by connector id. See src/lib/connectors. */
  connectors: Record<string, Record<string, string>>;
}

const DEFAULT_SETTINGS: AppSettings = {
  investmentAmount: 0,
  sentinel: null,
  smtp: null,
  organisation: null,
  connectors: {},
};

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadFromDisk(): AppSettings {
  try {
    if (existsSync(SETTINGS_FILE)) {
      const raw = readFileSync(SETTINGS_FILE, "utf-8");
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error("Failed to read settings file:", err);
  }
  return { ...DEFAULT_SETTINGS };
}

function saveToDisk(settings: AppSettings) {
  try {
    ensureDataDir();
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write settings file:", err);
  }
}

// Singleton — initialise from disk once, then keep in memory + sync back.
const g = globalThis as any;
if (!g.__sfSettings) {
  g.__sfSettings = loadFromDisk();
  // Apply saved SMTP settings to env on startup
  const saved = g.__sfSettings as AppSettings;
  if (saved.smtp?.host) {
    process.env.SMTP_HOST = saved.smtp.host;
    process.env.SMTP_PORT = String(saved.smtp.port);
    process.env.SMTP_USER = saved.smtp.user;
    process.env.SMTP_PASS = saved.smtp.pass;
    if (saved.smtp.from) process.env.SMTP_FROM = saved.smtp.from;
  }
}

export function getSettings(): AppSettings {
  return g.__sfSettings as AppSettings;
}

/** Save or remove (config = null) one connector's credentials. Masked secrets keep the stored value. */
export function updateConnector(id: string, config: Record<string, string> | null): Record<string, string> | null {
  const current = getSettings();
  if (!current.connectors) current.connectors = {};
  if (config === null) {
    delete current.connectors[id];
  } else {
    const existing = current.connectors[id] || {};
    const merged: Record<string, string> = { ...existing };
    for (const [key, value] of Object.entries(config)) {
      if (value === "••••••••") continue; // unchanged secret
      merged[key] = String(value ?? "").trim();
    }
    current.connectors[id] = merged;
  }
  g.__sfSettings = current;
  saveToDisk(current);
  return current.connectors[id] ?? null;
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getSettings();

  if (partial.investmentAmount !== undefined) {
    current.investmentAmount = Math.max(0, Number(partial.investmentAmount) || 0);
  }

  if (partial.sentinel !== undefined) {
    if (partial.sentinel === null) {
      current.sentinel = null;
    } else {
      const ex = current.sentinel || { tenantId: "", clientId: "", clientSecret: "", workspaceId: "", pollingIntervalMs: 900000 };
      current.sentinel = {
        tenantId: partial.sentinel.tenantId ?? ex.tenantId,
        clientId: partial.sentinel.clientId ?? ex.clientId,
        clientSecret:
          partial.sentinel.clientSecret && partial.sentinel.clientSecret !== "••••••••"
            ? partial.sentinel.clientSecret
            : ex.clientSecret,
        workspaceId: partial.sentinel.workspaceId ?? ex.workspaceId,
        pollingIntervalMs: partial.sentinel.pollingIntervalMs ?? ex.pollingIntervalMs,
      };
    }
  }

  if (partial.organisation !== undefined && partial.organisation !== null) {
    const ex = current.organisation || { revenueBand: null, lossEventsLast12Months: 0, typicalControlEffectiveness: null };
    const o = partial.organisation;
    const typical = Number(o.typicalControlEffectiveness);
    current.organisation = {
      revenueBand: o.revenueBand !== undefined ? (o.revenueBand || null) : ex.revenueBand,
      lossEventsLast12Months:
        o.lossEventsLast12Months !== undefined ? Math.max(0, Math.floor(Number(o.lossEventsLast12Months) || 0)) : ex.lossEventsLast12Months,
      typicalControlEffectiveness:
        o.typicalControlEffectiveness === undefined ? ex.typicalControlEffectiveness
        : isFinite(typical) && typical >= 0.2 && typical <= 0.8 ? typical : null,
    };
  }

  if (partial.smtp !== undefined) {
    if (partial.smtp === null) {
      current.smtp = null;
    } else {
      const ex = current.smtp || { host: "", port: 587, user: "", pass: "", from: "" };
      current.smtp = {
        host: partial.smtp.host ?? ex.host,
        port: partial.smtp.port ?? ex.port,
        user: partial.smtp.user ?? ex.user,
        pass:
          partial.smtp.pass && partial.smtp.pass !== "••••••••"
            ? partial.smtp.pass
            : ex.pass,
        from: partial.smtp.from ?? ex.from,
      };
    }
  }

  g.__sfSettings = current;
  saveToDisk(current);

  // Apply SMTP settings to environment so email.ts picks them up
  if (current.smtp?.host) {
    process.env.SMTP_HOST = current.smtp.host;
    process.env.SMTP_PORT = String(current.smtp.port);
    process.env.SMTP_USER = current.smtp.user;
    process.env.SMTP_PASS = current.smtp.pass;
    if (current.smtp.from) process.env.SMTP_FROM = current.smtp.from;
    // Clear cached transporter so it picks up new config
    (globalThis as any).__sfMailTransporter = null;
  }

  return current;
}
