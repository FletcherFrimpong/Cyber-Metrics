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
}

const DEFAULT_SETTINGS: AppSettings = {
  investmentAmount: 0,
  sentinel: null,
  smtp: null,
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
