import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/auth/user-store";

// Rate limiter — prevent mass account creation
const signupAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_SIGNUPS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = signupAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    signupAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_SIGNUPS;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many signup attempts. Try again later." },
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

  const { username, password, displayName, email } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  if (username.length < 3) {
    return NextResponse.json(
      { error: "Username must be at least 3 characters" },
      { status: 400 }
    );
  }

  try {
    const user = await createUser({
      username,
      password,
      displayName: displayName || username,
      email: email || "",
      role: "viewer", // Self-registration always creates viewers
    });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
}
