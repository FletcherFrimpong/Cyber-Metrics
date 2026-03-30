import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/lib/auth/user-store";

export async function GET() {
  const auth = await requireAuth("users:manage");
  if (isAuthError(auth)) return auth;

  return NextResponse.json({ users: getAllUsers() });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth("users:manage");
  if (isAuthError(auth)) return auth;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { username, password, displayName, email, role } = body;

  if (!username || !password || !role) {
    return NextResponse.json(
      { error: "Username, password, and role are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  if (!["admin", "analyst", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  try {
    const user = await createUser({
      username,
      password,
      displayName: displayName || username,
      email: email || "",
      role,
    });
    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth("users:manage");
  if (isAuthError(auth)) return auth;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { id, displayName, email, role, password } = body;
  if (!id) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  if (role && !["admin", "analyst", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (password && password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const user = await updateUser(id, { displayName, email, role, password });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, user });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth("users:manage");
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  // Prevent deleting yourself
  if (id === auth.userId) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  const deleted = deleteUser(id);
  if (!deleted) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
