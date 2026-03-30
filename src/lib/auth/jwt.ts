import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload } from "./types";

const TOKEN_LIFETIME = "8h";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.warn(
      "[auth] AUTH_SECRET not set — using fallback key. Set AUTH_SECRET in production."
    );
    return new TextEncoder().encode("sf-dev-secret-change-me-in-production");
  }
  return new TextEncoder().encode(secret);
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
