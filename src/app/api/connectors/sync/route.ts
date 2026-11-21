import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";
import { getConnector, getConnectorManager, startSavedConnectors } from "@/lib/connectors/runtime";

// POST { id, fullResync? }: pull from one connector now.
export async function POST(request: NextRequest) {
  const auth = await requireAuth("sentinel:sync");
  if (isAuthError(auth)) return auth;
  startSavedConnectors();

  const body = await request.json().catch(() => null);
  const def = body && getConnector(body.id);
  if (!def) return NextResponse.json({ error: "Unknown connector" }, { status: 400 });

  const manager = getConnectorManager();
  if (!manager.isRunning(def.id)) {
    return NextResponse.json({ error: "Connector is not configured" }, { status: 503 });
  }
  try {
    const result = await manager.syncNow(def.id, !!body.fullResync);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Sync failed" }, { status: 502 });
  }
}
