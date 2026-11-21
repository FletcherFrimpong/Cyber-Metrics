// POST /api/sentinel/webhook
// Receives resolved Microsoft Defender XDR / Sentinel incidents pushed from an
// automation rule or Logic App, in Microsoft Graph security incident format
// (each incident carrying its alerts). Validates an HMAC signature, maps the
// alerts and feeds them into the data service.
// Set DEFENDER_WEBHOOK_SECRET (or the older SENTINEL_WEBHOOK_SECRET) to enable it.

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { mapDefenderIncident } from "@/lib/connectors/defender.ts";
import edrDataService from "@/lib/edr-data-service";
import type { SecurityAlert } from "@/types/alerts";
import type { AlertCategory } from "@/lib/connectors/types";

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = Buffer.from(createHmac("sha256", secret).update(body).digest("hex"));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.DEFENDER_WEBHOOK_SECRET || process.env.SENTINEL_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Webhook secret not configured. Set DEFENDER_WEBHOOK_SECRET to enable this endpoint." },
        { status: 403 }
      );
    }

    const signature = request.headers.get("x-sentinel-signature") || "";
    const bodyText = await request.text();
    if (!verifySignature(bodyText, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);
    // Accept both { incidents: [...] } and { incident: {...} }
    const incidents: any[] = payload.incidents || (payload.incident ? [payload.incident] : []);
    if (incidents.length === 0) {
      return NextResponse.json({ error: "No incidents in payload" }, { status: 400 });
    }

    const byCategory = new Map<AlertCategory, SecurityAlert[]>();
    for (const incident of incidents) {
      for (const { category, alert } of mapDefenderIncident(incident)) {
        const list = byCategory.get(category);
        if (list) list.push(alert);
        else byCategory.set(category, [alert]);
      }
    }
    const categories: Record<string, number> = {};
    let processed = 0;
    for (const [category, alerts] of byCategory) {
      edrDataService.ingestAlerts(alerts, category);
      categories[category] = alerts.length;
      processed += alerts.length;
    }

    return NextResponse.json({ success: true, processed, incidents: incidents.length, categories, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
