import { NextRequest, NextResponse } from "next/server";
import { hasAnyUsers, createUser } from "@/lib/auth/user-store";

export async function GET() {
  return NextResponse.json({ needsSetup: !hasAnyUsers() });
}

export async function POST(request: NextRequest) {
  if (hasAnyUsers()) {
    return NextResponse.json(
      { error: "Setup already completed. Users exist." },
      { status: 403 }
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

  const user = await createUser({
    username,
    password,
    displayName: displayName || username,
    email: email || "",
    role: "admin",
  });

  return NextResponse.json({ success: true, user });
}
