import type { NextConfig } from "next";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";

// ─── AUTO-GENERATE AUTH_SECRET IF NOT SET ────────────────────────────────
// This runs at startup (before any request) so the secret is available
// in both Node and Edge runtimes (middleware).
const DATA_DIR = join(process.cwd(), ".data");
const SECRET_FILE = join(DATA_DIR, ".auth-secret");

if (!process.env.AUTH_SECRET) {
  let secret: string | null = null;

  // Try reading persisted secret
  try {
    if (existsSync(SECRET_FILE)) {
      secret = readFileSync(SECRET_FILE, "utf-8").trim();
    }
  } catch {}

  // Generate new secret if none exists
  if (!secret) {
    secret = randomBytes(32).toString("base64url");
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(SECRET_FILE, secret, { encoding: "utf-8", mode: 0o600 });
    } catch {}
    console.log("[auth] Auto-generated AUTH_SECRET. Set AUTH_SECRET in .env for production.");
  }

  process.env.AUTH_SECRET = secret;
}

// ─── NEXT.JS CONFIG ──────────────────────────────────────────────────────
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
