// POST /api/sentinel/webhook
// Receives resolved incidents pushed from Sentinel automation rules / Logic Apps.
// Validates HMAC signature, transforms alerts, feeds into data service.

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getSentinelConfig } from "@/lib/sentinel-config";
import { transformIncident, type SentinelIncident } from "@/lib/sentinel-category-mapper";

// Lazy import to avoid circular deps at module load time
async function getDataService() {
  const mod = await import("@/lib/edr-data-service");
  return mod.default;
}

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return signature === expected;
}

export async function POST(request: NextRequest) {
  try {
    const config = getSentinelConfig();
    if (!config) {
      return NextResponse.json({ error: "Sentinel not configured" }, { status: 503 });
    }

    // Verify webhook signature if secret is configured
    if (config.webhookSecret) {
      const signature = request.headers.get("x-sentinel-signature") || "";
      const bodyText = await request.text();

      if (!verifySignature(bodyText, signature, config.webhookSecret)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }

      // Parse the body we already read
      const payload = JSON.parse(bodyText);
      return await processPayload(payload);
    }

    // No signature verification — just parse
    const payload = await request.json();
    return await processPayload(payload);
  } catch (error: any) {
    console.error("Sentinel webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processPayload(payload: { incidents?: SentinelIncident[]; incident?: SentinelIncident }) {
  // Accept both { incidents: [...] } and { incident: {...} } (single)
  const incidents = payload.incidents || (payload.incident ? [payload.incident] : []);

  if (incidents.length === 0) {
    return NextResponse.json({ error: "No incidents in payload" }, { status: 400 });
  }

  const dataService = await getDataService();
  let processed = 0;
  const categories: Record<string, number> = {};

  for (const incident of incidents) {
    const grouped = transformIncident(incident);
    for (const { category, alerts } of grouped) {
      dataService.ingestAlerts(alerts, category);
      categories[category] = (categories[category] || 0) + alerts.length;
      processed += alerts.length;
    }
  }

  return NextResponse.json({
    success: true,
    processed,
    incidents: incidents.length,
    categories,
    timestamp: new Date().toISOString(),
  });
}
