import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";
import { getSettings } from "@/lib/settings-store";
import { getConnector, isConfigured } from "@/lib/connectors/runtime";
import { SECRET_MASK } from "@/lib/connectors/types";

// POST { id, config }: try the credentials without saving them.
export async function POST(request: NextRequest) {
  const auth = await requireAuth("sentinel:configure");
  if (isAuthError(auth)) return auth;

  const body = await request.json().catch(() => null);
  const def = body && getConnector(body.id);
  if (!def) return NextResponse.json({ error: "Unknown connector" }, { status: 400 });

  // A masked secret means "use the one already saved".
  const saved = (getSettings().connectors || {})[def.id] || {};
  const config: Record<string, string> = {};
  for (const field of def.fields) {
    const value = body.config?.[field.key];
    config[field.key] = typeof value === "string" && value !== SECRET_MASK ? value.trim() : saved[field.key] || "";
  }
  if (!isConfigured(def, config)) {
    return NextResponse.json({ success: false, message: "Fill in every required field first." }, { status: 400 });
  }

  try {
    const result = await def.test(config);
    return NextResponse.json({ success: result.ok, message: result.message });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Connection failed" });
  }
}
