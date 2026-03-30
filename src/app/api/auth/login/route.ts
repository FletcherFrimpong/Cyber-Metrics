import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername, seedDefaultAdmin } from "@/lib/auth/user-store";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { toSafeUser } from "@/lib/auth/user-store";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";

// Simple rate limiter: IP -> { count, resetAt }
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): { blocked: boolean; remaining: number } {
  const now = Date.now();
  const entry = failedAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    return { blocked: false, remaining: MAX_ATTEMPTS };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { blocked: true, remaining: 0 };
  }

  return { blocked: false, remaining: MAX_ATTEMPTS - entry.count };
}

function recordFailure(ip: string) {
  const now = Date.now();
  const entry = failedAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    failedAttempts.set(ip, { count: 1, resetAt: now + LOCKOUT_MS });
  } else {
    entry.count++;
  }
}

function clearFailures(ip: string) {
  failedAttempts.delete(ip);
}

export async function POST(request: NextRequest) {
  // Ensure default admin exists on first login attempt
  await seedDefaultAdmin();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const rateCheck = checkRateLimit(ip);
  if (rateCheck.blocked) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again later." },
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  const user = getUserByUsername(username);
  if (!user) {
    recordFailure(ip);
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    recordFailure(ip);
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  clearFailures(ip);
  await createSession(user);

  // Auto-delete initial credentials file after first admin login
  try {
    const credsFile = join(process.cwd(), ".data", "initial-credentials.txt");
    if (existsSync(credsFile)) {
      unlinkSync(credsFile);
      console.log("[auth] Initial credentials file deleted after successful login.");
    }
  } catch {}

  return NextResponse.json({
    success: true,
    user: toSafeUser(user),
  });
}
