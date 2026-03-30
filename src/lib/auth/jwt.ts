import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload } from "./types";

const TOKEN_LIFETIME = "8h";

/**
 * Get the JWT signing secret from AUTH_SECRET env var.
 * The secret is initialized in next.config.ts at startup (auto-generated
 * if not set), so it's available in both Node and Edge runtimes.
 */
function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Check next.config.ts initialization.");
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
