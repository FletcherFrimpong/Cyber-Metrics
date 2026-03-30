// Persistent settings store backed by a local JSON file.
// Falls back to in-memory storage if file operations fail.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), ".data");
const SETTINGS_FILE = join(DATA_DIR, "settings.json");

export interface AppSettings {
  investmentAmount: number;
  sentinel: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    workspaceId: string;
    pollingIntervalMs: number;
  } | null;
}

const DEFAULT_SETTINGS: AppSettings = {
  investmentAmount: 0,
  sentinel: null,
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

  g.__sfSettings = current;
  saveToDisk(current);
  return current;
}
