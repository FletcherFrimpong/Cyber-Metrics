import { NextRequest, NextResponse } from "next/server";
import { getUserByInviteToken, acceptInvite } from "@/lib/auth/user-store";
import { toSafeUser } from "@/lib/auth/user-store";

// GET: Validate token and return invite info (name, role, email)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const user = getUserByInviteToken(token);
  if (!user) {
    return NextResponse.json({ error: "Invalid or expired invite link" }, { status: 404 });
  }

  if (user.status !== "pending") {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 400 });
  }

  if (user.inviteTokenExpiry && new Date(user.inviteTokenExpiry) < new Date()) {
    return NextResponse.json({ error: "This invite link has expired" }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  });
}

// POST: Accept invite — set username + password, activate account
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { token, username, password, displayName } = body;

  if (!token || !username || !password) {
    return NextResponse.json(
      { error: "Token, username, and password are required" },
      { status: 400 }
    );
  }

  if (username.length < 3) {
    return NextResponse.json(
      { error: "Username must be at least 3 characters" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    const user = await acceptInvite({ token, username, password, displayName });
    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
