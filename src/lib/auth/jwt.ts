import { SignJWT, jwtVerify } from "jose";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";
import type { SessionPayload } from "./types";

const TOKEN_LIFETIME = "8h";
const DATA_DIR = join(process.cwd(), ".data");
const SECRET_FILE = join(DATA_DIR, ".auth-secret");

/**
 * Get the JWT signing secret. Priority:
 * 1. AUTH_SECRET env var (recommended for production)
 * 2. Auto-generated secret persisted in .data/.auth-secret (dev/first-run)
 *
 * Never uses a hardcoded fallback — always unique per installation.
 */
function getSecret(): Uint8Array {
  const envSecret = process.env.AUTH_SECRET;
  if (envSecret) {
    return new TextEncoder().encode(envSecret);
  }

  // Auto-generate and persist a secret for this installation
  try {
    if (existsSync(SECRET_FILE)) {
      const saved = readFileSync(SECRET_FILE, "utf-8").trim();
      if (saved) return new TextEncoder().encode(saved);
    }
  } catch {}

  // Generate new secret
  const generated = randomBytes(32).toString("base64url");
  console.warn(
    "[auth] AUTH_SECRET not set — auto-generated a secret. Set AUTH_SECRET in .env for production."
  );

  // Persist to disk and env so middleware (Edge Runtime) can pick it up
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(SECRET_FILE, generated, { encoding: "utf-8", mode: 0o600 });
  } catch {
    console.warn("[auth] Could not persist auto-generated secret to disk.");
  }
  process.env.AUTH_SECRET = generated;

  return new TextEncoder().encode(generated);
}

export async function signToken(
  payload: Omit<SessionPayload, "iat" | "exp">
): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_LIFETIME)
    .sign(getSecret());
}

export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// Lightweight verify for Edge Runtime (middleware) — same logic, exported separately
// so the import path is clear.
export { getSecret as getJwtSecret };
