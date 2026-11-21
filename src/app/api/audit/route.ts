import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";
import { listAudit } from "@/lib/audit-log";

// GET ?limit=100: the most recent audit events. Administrators and owners only.
export async function GET(request: NextRequest) {
  const auth = await requireAuth("audit:view");
  if (isAuthError(auth)) return auth;
  const limit = parseInt(new URL(request.url).searchParams.get("limit") || "100", 10) || 100;
  return NextResponse.json({ entries: listAudit(limit) });
}
