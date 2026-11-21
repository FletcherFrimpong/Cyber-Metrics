import { NextResponse } from "next/server";
import { getSession } from "./session";
import { hasPermission } from "./rbac";
import { getUserById } from "./user-store";
import type { Permission, SessionPayload } from "./types";

/**
 * Require authentication and optionally a specific permission.
 * Returns the session payload if authorized, or a NextResponse error.
 */
export async function requireAuth(
  permission?: Permission
): Promise<SessionPayload | NextResponse> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // A signed token is not enough: the account must still exist, and its
  // CURRENT role applies, so deleting or demoting a user takes effect at once.
  const user = getUserById(session.userId);
  if (!user || user.status === "pending") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (permission && !hasPermission(user.role, permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { ...session, role: user.role };
}

/**
 * Type guard to check if requireAuth returned an error response.
 */
export function isAuthError(
  result: SessionPayload | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
