import { audit } from "@/lib/audit-log";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";
import { getSettings, updateConnector } from "@/lib/settings-store";
import { CONNECTORS, getConnector, getConnectorManager, isConfigured, startSavedConnectors } from "@/lib/connectors/runtime";
import { SECRET_MASK } from "@/lib/connectors/types";
import edrDataService from "@/lib/edr-data-service";

// GET: every available connector with its form fields, saved values (secrets masked) and status.
export async function GET() {
  const auth = await requireAuth("settings:view");
  if (isAuthError(auth)) return auth;
  startSavedConnectors();

  const saved = getSettings().connectors || {};
  const manager = getConnectorManager();
  return NextResponse.json({
    connectors: CONNECTORS.map((def) => {
      const config = saved[def.id] || {};
      const values: Record<string, string> = {};
      for (const field of def.fields) {
        const value = config[field.key] || field.default || "";
        values[field.key] = field.type === "password" && value ? SECRET_MASK : value;
      }
      return {
        id: def.id,
        name: def.name,
        kind: def.kind,
        description: def.description,
        docsUrl: def.docsUrl,
        setupSteps: def.setupSteps,
        fields: def.fields,
        values,
        configured: isConfigured(def, config),
        status: manager.getStatus(def.id),
        alertsHeld: edrDataService.countBySourcePrefix(def.idPrefix),
      };
    }),
  });
}

// POST { id, config } saves credentials and starts polling. { id, config: null } disconnects.
export async function POST(request: NextRequest) {
  const auth = await requireAuth("sentinel:configure");
  if (isAuthError(auth)) return auth;

  const body = await request.json().catch(() => null);
  const def = body && getConnector(body.id);
  if (!def) return NextResponse.json({ error: "Unknown connector" }, { status: 400 });

  const manager = getConnectorManager();
  if (body.config === null) {
    updateConnector(def.id, null);
    manager.forget(def.id);
    edrDataService.removeBySourcePrefix(def.idPrefix);
    if (!CONNECTORS.some((c) => manager.isRunning(c.id))) edrDataService.restoreSampleData();
    audit({ actor: auth.username, actorRole: auth.role, action: "integration.disconnect", target: def.name });
    return NextResponse.json({ success: true, configured: false });
  }
  if (!body.config || typeof body.config !== "object") {
    return NextResponse.json({ error: "config is required" }, { status: 400 });
  }

  // Only accept the fields this connector declares.
  const incoming: Record<string, string> = {};
  for (const field of def.fields) {
    if (typeof body.config[field.key] === "string") incoming[field.key] = body.config[field.key];
  }
  const config = updateConnector(def.id, incoming) || {};
  if (!isConfigured(def, config)) {
    manager.stop(def.id);
    return NextResponse.json({ error: "Required fields are missing" }, { status: 400 });
  }

  edrDataService.useRealData();
  manager.start(def, config);
  audit({ actor: auth.username, actorRole: auth.role, action: "integration.connect", target: def.name });
  return NextResponse.json({ success: true, configured: true });
}
