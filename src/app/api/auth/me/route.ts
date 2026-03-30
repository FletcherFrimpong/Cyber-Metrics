import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserById, toSafeUser } from "@/lib/auth/user-store";
import { getPermissions } from "@/lib/auth/rbac";
import { seedDefaultAdmin } from "@/lib/auth/user-store";

export async function GET() {
  await seedDefaultAdmin();

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  return NextResponse.json({
    user: toSafeUser(user),
    permissions: getPermissions(user.role),
  });
}
